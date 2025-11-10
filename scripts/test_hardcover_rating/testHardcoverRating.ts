#!/usr/bin/env node

/**
 * Test Hardcover Rating Sync
 * 
 * This script tests the full flow of syncing a rating to Hardcover:
 * 1. Lookup book by ISBN
 * 2. Check if user_book relationship exists
 * 3. Create it if it doesn't exist
 * 4. Add rating to the relationship
 * 
 * Usage:
 *   ts-node testHardcoverRating.ts <token> <isbn> <rating>
 *   or
 *   ts-node testHardcoverRating.ts --token <token> --isbn <isbn> --rating <rating>
 * 
 * Example:
 *   ts-node testHardcoverRating.ts your-token 9781234567890 5
 */

const HARDCOVER_API_URL = 'https://api.hardcover.app/v1/graphql';

interface GraphQLResponse {
  data?: any;
  errors?: Array<{
    message: string;
    extensions?: {
      code?: string;
    };
  }>;
}

function cleanToken(token: string): string {
  return token.replace(/^Bearer\s+/i, '').trim();
}

async function makeRequest(
  token: string,
  query: string,
  variables?: Record<string, any>
): Promise<GraphQLResponse> {
  const cleanTokenValue = cleanToken(token);

  const response = await fetch(HARDCOVER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cleanTokenValue}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const contentType = response.headers.get('content-type');

  if (!response.ok) {
    let errorText = `HTTP ${response.status}: ${response.statusText}`;
    try {
      if (contentType?.includes('application/json')) {
        const errorBody = await response.json();
        if (errorBody.errors) {
          errorText = errorBody.errors.map((e: any) => e.message).join(', ');
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }
    throw new Error(errorText);
  }

  if (!contentType?.includes('application/json')) {
    const textBody = await response.text();
    throw new Error(`Expected JSON but got ${contentType}. Response: ${textBody.substring(0, 200)}`);
  }

  const result = await response.json();

  if (result.errors) {
    const errorMessages = result.errors.map((e: any) => e.message).join(', ');
    throw new Error(errorMessages);
  }

  return result;
}

async function lookupBookByIsbn(token: string, isbn: string): Promise<{ success: boolean; bookId?: number; error?: string }> {
  try {
    // Normalize ISBN: remove hyphens and spaces
    const normalizedIsbn = isbn.replace(/[-\s]/g, '');
    const isbnLength = normalizedIsbn.length;
    
    // Determine which field to use based on ISBN length
    let isbnField = '';
    if (isbnLength === 10) {
      isbnField = 'isbn_10';
    } else if (isbnLength === 13) {
      isbnField = 'isbn_13';
    } else {
      // Try both with _or
      const result = await makeRequest(
        token,
        `
          query LookupBook($isbn: String!) {
            editions(where: {_or: [{isbn_13: {_eq: $isbn}}, {isbn_10: {_eq: $isbn}}]}) {
              id
              book {
                id
              }
            }
          }
        `,
        { isbn: normalizedIsbn }
      );

      const editions = result.data?.editions;
      if (Array.isArray(editions) && editions.length > 0) {
        const edition = editions[0];
        if (edition?.book?.id) {
          return { success: true, bookId: edition.book.id };
        }
      }
      return { success: false, error: 'Book not found' };
    }

    const result = await makeRequest(
      token,
      `
        query LookupBook($isbn: String!) {
          editions(where: {${isbnField}: {_eq: $isbn}}) {
            id
            book {
              id
            }
          }
        }
      `,
      { isbn: normalizedIsbn }
    );

    const editions = result.data?.editions;
    if (Array.isArray(editions) && editions.length > 0) {
      const edition = editions[0];
      if (edition?.book?.id) {
        return { success: true, bookId: edition.book.id };
      }
    }

    return { success: false, error: 'Book not found in Hardcover' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

async function checkUserBookRelationship(
  token: string,
  bookId: number
): Promise<{ success: boolean; exists: boolean; userBookId?: number; error?: string }> {
  try {
    const result = await makeRequest(
      token,
      `
        query CheckUserBook($bookId: Int!) {
          user_books(where: {book_id: {_eq: $bookId}}) {
            id
            book_id
            rating
          }
        }
      `,
      { bookId }
    );

    const userBooks = result.data?.user_books;
    if (Array.isArray(userBooks) && userBooks.length > 0) {
      const userBook = userBooks[0];
      if (userBook?.id) {
        console.log(`   Found user_book: ID=${userBook.id}, book_id=${userBook.book_id}, current_rating=${userBook.rating || 'none'}`);
        return { success: true, exists: true, userBookId: userBook.id };
      }
    }

    return { success: true, exists: false };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, exists: false, error: errorMsg };
  }
}

async function introspectUserBookInsertInput(
  token: string
): Promise<{ success: boolean; fields?: any[]; error?: string }> {
  try {
    const result = await makeRequest(
      token,
      `
        query IntrospectUserBookInsertInput {
          __type(name: "UserBookInsertInput") {
            inputFields {
              name
              type {
                name
                kind
                ofType {
                  name
                  kind
                }
              }
            }
          }
        }
      `
    );

    const inputFields = result.data?.__type?.inputFields;
    if (inputFields && Array.isArray(inputFields)) {
      return { success: true, fields: inputFields };
    }

    return { success: false, error: 'Could not introspect UserBookInsertInput' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

async function createUserBookRelationship(
  token: string,
  bookId: number,
  rating: number
): Promise<{ success: boolean; userBookId?: number; error?: string }> {
  try {
    console.log(`   Creating user_book with book_id: ${bookId}, status_id: 3, rating: ${rating}, read_count: 1...`);
    const result = await makeRequest(
      token,
      `
        mutation CreateUserBook($bookId: Int!, $rating: numeric!) {
          insert_user_book(object: {book_id: $bookId, rating: $rating, status_id: 3, read_count: 1}) {
            id
          }
        }
      `,
      { bookId, rating: Number(rating) }
    );

    console.log(`   Response:`, JSON.stringify(result.data, null, 2));

    const userBook = Array.isArray(result.data?.insert_user_book)
      ? result.data.insert_user_book[0]
      : result.data?.insert_user_book;

    if (userBook?.id) {
      console.log(`   ✅ Created user_book: ID=${userBook.id}`);
      return { success: true, userBookId: userBook.id };
    }

    return { success: false, error: 'Failed to create user_book relationship' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

async function verifyUserBook(
  token: string,
  userBookId: number
): Promise<{ success: boolean; bookId?: number; error?: string }> {
  try {
    // Use user_books with where clause instead of user_books_by_pk
    const result = await makeRequest(
      token,
      `
        query VerifyUserBook($userBookId: Int!) {
          user_books(where: {id: {_eq: $userBookId}}) {
            id
            book_id
            status_id
            rating
          }
        }
      `,
      { userBookId }
    );

    const userBooks = result.data?.user_books;
    if (Array.isArray(userBooks) && userBooks.length > 0) {
      const userBook = userBooks[0];
      if (userBook?.id) {
        console.log(`   User_book details:`);
        console.log(`     ID: ${userBook.id}`);
        console.log(`     book_id: ${userBook.book_id}`);
        console.log(`     status_id: ${userBook.status_id || 'none'}`);
        console.log(`     rating: ${userBook.rating || 'none'}`);
        
        return { success: true, bookId: userBook.book_id };
      }
    }

    return { success: false, error: 'User_book not found' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

async function introspectMutation(
  token: string,
  mutationName: string
): Promise<{ success: boolean; mutationInfo?: any; error?: string }> {
  try {
    const result = await makeRequest(
      token,
      `
        query IntrospectMutation {
          __type(name: "mutation_root") {
            fields {
              name
              args {
                name
                type {
                  name
                  kind
                  ofType {
                    name
                    kind
                  }
                }
              }
            }
          }
        }
      `
    );

    const fields = result.data?.__type?.fields;
    if (fields && Array.isArray(fields)) {
      const mutation = fields.find((f: any) => f.name === mutationName);
      if (mutation) {
        return { success: true, mutationInfo: mutation };
      }
    }

    return { success: false, error: `Mutation ${mutationName} not found` };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

async function listAllMutations(
  token: string
): Promise<{ success: boolean; mutations?: string[]; error?: string }> {
  try {
    const result = await makeRequest(
      token,
      `
        query ListMutations {
          __type(name: "mutation_root") {
            fields {
              name
            }
          }
        }
      `
    );

    const fields = result.data?.__type?.fields;
    if (fields && Array.isArray(fields)) {
      const mutations = fields.map((f: any) => f.name);
      return { success: true, mutations };
    }

    return { success: false, error: 'Could not list mutations' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

async function addRatingToUserBook(
  token: string,
  userBookId: number,
  rating: number
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`   Attempting to update user_book ID: ${userBookId} with rating: ${rating}`);
    
    // Try update_user_book first
    try {
      const result = await makeRequest(
        token,
        `
          mutation AddRating($userBookId: Int!, $rating: numeric!) {
            update_user_book(id: $userBookId, object: {rating: $rating}) {
              id
              error
              user_book {
                id
                rating
              }
            }
          }
        `,
        { userBookId, rating: Number(rating) }
      );

      console.log(`   Response:`, JSON.stringify(result.data, null, 2));

      const updated = Array.isArray(result.data?.update_user_book)
        ? result.data.update_user_book[0]
        : result.data?.update_user_book;

      if (updated?.error) {
        // The error "Record not found" is strange since we can query the record
        // This might be a permission issue or the mutation expects a different ID
        console.log(`   ⚠️  update_user_book returned error: ${updated.error}`);
        console.log(`   ⚠️  But the response includes user_book data, suggesting the mutation structure might be wrong`);
        console.log(`   ⚠️  Trying alternative approaches...`);
        return await addRatingToUserBookByPk(token, userBookId, rating);
      }

      if (updated?.id || updated?.user_book?.id) {
        const finalRating = updated?.user_book?.rating || 'updated';
        console.log(`   ✅ Rating updated successfully. New rating: ${finalRating}`);
        return { success: true };
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.log(`   ⚠️  update_user_book failed: ${errorMsg}, trying alternative...`);
      return await addRatingToUserBookByPk(token, userBookId, rating);
    }

    return { success: false, error: 'Update completed but no ID returned' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.log(`   ❌ Error details:`, errorMsg);
    return { success: false, error: errorMsg };
  }
}

async function addRatingToUserBookByPk(
  token: string,
  userBookId: number,
  rating: number
): Promise<{ success: boolean; error?: string }> {
  // Try using update_user_book with _set instead of object
  try {
    console.log(`   Trying update_user_book with _set parameter...`);
    const result = await makeRequest(
      token,
      `
        mutation AddRatingSet($userBookId: Int!, $rating: numeric!) {
          update_user_book(id: $userBookId, _set: {rating: $rating}) {
            id
            error
            user_book {
              id
              rating
            }
          }
        }
      `,
      { userBookId, rating: Number(rating) }
    );

    console.log(`   Response:`, JSON.stringify(result.data, null, 2));

    const updated = Array.isArray(result.data?.update_user_book)
      ? result.data.update_user_book[0]
      : result.data?.update_user_book;

    if (updated?.error) {
      throw new Error(updated.error);
    }

    if (updated?.id || updated?.user_book?.id) {
      const finalRating = updated?.user_book?.rating || 'updated';
      console.log(`   ✅ Rating updated successfully using _set. New rating: ${finalRating}`);
      return { success: true };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.log(`   ⚠️  update_user_book with _set failed: ${errorMsg}`);
  }

  // Try using book_id instead of id - maybe update_user_book expects book_id?
  try {
    console.log(`   Trying update_user_book with book_id instead of id...`);
    // First get the book_id
    const verifyResult = await verifyUserBook(token, userBookId);
    if (!verifyResult.success || !verifyResult.bookId) {
      throw new Error('Could not get book_id');
    }

    const result = await makeRequest(
      token,
      `
        mutation AddRatingByBookId($bookId: Int!, $rating: numeric!) {
          update_user_book(book_id: $bookId, object: {rating: $rating}) {
            id
            error
            user_book {
              id
              rating
            }
          }
        }
      `,
      { bookId: verifyResult.bookId, rating: Number(rating) }
    );

    console.log(`   Response:`, JSON.stringify(result.data, null, 2));

    const updated = Array.isArray(result.data?.update_user_book)
      ? result.data.update_user_book[0]
      : result.data?.update_user_book;

    if (updated?.error) {
      throw new Error(updated.error);
    }

    if (updated?.id || updated?.user_book?.id) {
      const finalRating = updated?.user_book?.rating || 'updated';
      console.log(`   ✅ Rating updated successfully using book_id. New rating: ${finalRating}`);
      return { success: true };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.log(`   ⚠️  update_user_book with book_id failed: ${errorMsg}`);
  }

  return { success: false, error: 'All alternative update methods failed. The mutation might require different permissions or a different identifier.' };
}

async function testRatingSync(token: string, isbn: string, rating: number): Promise<void> {
  console.log('🔍 Testing Hardcover user_book creation...\n');
  console.log(`📚 ISBN: ${isbn}\n`);

  // Step 1: Lookup book by ISBN to get Hardcover book ID
  console.log('Step 1: Looking up book by ISBN...');
  const bookLookup = await lookupBookByIsbn(token, isbn);
  if (!bookLookup.success || !bookLookup.bookId) {
    console.error(`❌ Failed to lookup book: ${bookLookup.error}`);
    process.exit(1);
  }
  console.log(`✅ Found book ID: ${bookLookup.bookId}\n`);

  const bookId = bookLookup.bookId;

  // Step 2: Create user_book relationship with status_id: 3, rating, and read_count: 1
  console.log('Step 2: Creating user_book relationship...');
  const createResult = await createUserBookRelationship(token, bookId, rating);
  if (!createResult.success || !createResult.userBookId) {
    console.error(`❌ Failed to create relationship: ${createResult.error}`);
    process.exit(1);
  }
  console.log(`✅ Created user_book relationship (ID: ${createResult.userBookId})\n`);

  // Step 3: Verify user_book exists
  console.log(`Step 3: Verifying user_book (ID: ${createResult.userBookId}) exists...`);
  const verifyResult = await verifyUserBook(token, createResult.userBookId);
  if (!verifyResult.success) {
    console.error(`❌ Failed to verify user_book: ${verifyResult.error}`);
    process.exit(1);
  }
  console.log(`✅ Verified user_book exists\n`);

  console.log('🎉 User_book creation completed successfully!');
  console.log(`   Book ID: ${bookId}`);
  console.log(`   User Book ID: ${createResult.userBookId}`);
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  let token: string | undefined;
  let isbn: string | undefined;
  let rating: number | undefined;

  if (args.length === 0) {
    console.error('❌ Error: Missing required arguments');
    console.log('\nUsage:');
    console.log('  ts-node testHardcoverRating.ts <token> <isbn> [rating]');
    console.log('  ts-node testHardcoverRating.ts --token <token> --isbn <isbn> [--rating <rating>]');
    console.log('\nExample:');
    console.log('  ts-node testHardcoverRating.ts your-token 9781234567890');
    console.log('  ts-node testHardcoverRating.ts your-token 9781234567890 5');
    process.exit(1);
  }

  // Parse arguments
  if (args[0] === '--token' || args[0] === '-t') {
    token = args[1];
    const isbnIndex = args.indexOf('--isbn') !== -1 ? args.indexOf('--isbn') : args.indexOf('-i');
    const ratingIndex = args.indexOf('--rating') !== -1 ? args.indexOf('--rating') : args.indexOf('-r');
    
    if (isbnIndex !== -1) {
      isbn = args[isbnIndex + 1];
    }
    if (ratingIndex !== -1) {
      rating = parseInt(args[ratingIndex + 1], 10);
    }
  } else {
    // Positional arguments
    token = args[0];
    isbn = args[1];
    rating = args[2] ? parseInt(args[2], 10) : undefined;
  }

  if (!token) {
    console.error('❌ Error: Token is required');
    process.exit(1);
  }

  if (!isbn) {
    console.error('❌ Error: ISBN is required');
    process.exit(1);
  }

  // Rating is optional - we're just testing creation for now
  // If provided, validate it
  if (rating !== undefined && (isNaN(rating) || rating < 1 || rating > 5)) {
    console.error('❌ Error: Rating must be a number between 1 and 5');
    process.exit(1);
  }

  try {
    await testRatingSync(token, isbn, rating || 0);
    process.exit(0);
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

