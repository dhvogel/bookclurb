/**
 * Hardcover API Utility
 * 
 * Centralized functions for interacting with the Hardcover API.
 * Handles authentication, error handling, and response parsing.
 */

const HARDCOVER_API_URL = 'https://api.hardcover.app/v1/graphql';

export interface HardcoverCachedImage {
  id: number;
  url: string;
  color: string;
  width: number;
  height: number;
  color_name: string;
}

export interface HardcoverMeResponse {
  data?: {
    me?: {
      id: string | number;
      username: string;
      cached_image?: HardcoverCachedImage;
    } | Array<{
      id: number;
      username: string;
      cached_image?: HardcoverCachedImage;
    }>;
  };
  errors?: Array<{
    message: string;
    extensions?: {
      code?: string;
    };
  }>;
}

/**
 * Clean a token by removing "Bearer " prefix if present
 */
export function cleanToken(token: string): string {
  return token.replace(/^Bearer\s+/i, '').trim();
}

/**
 * Make a GraphQL request to the Hardcover API
 */
async function makeHardcoverRequest(
  token: string,
  query: string,
  variables?: Record<string, any>
): Promise<{ data?: any; errors?: Array<{ message: string }> }> {
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

    // Try to get error details from response body
    try {
      if (contentType?.includes('application/json')) {
        const errorBody = await response.json();
        if (errorBody.errors) {
          errorText = errorBody.errors.map((e: any) => e.message).join(', ');
        } else if (errorBody.message) {
          errorText = errorBody.message;
        }
      } else {
        const textBody = await response.text();
        if (textBody) {
          errorText += ` - ${textBody.substring(0, 200)}`;
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

/**
 * Test if a Hardcover API token is valid and get user info
 */
export async function testHardcoverToken(
  token: string
): Promise<{ valid: boolean; user?: { id: string; username: string; cachedImageUrl?: string }; error?: string }> {
  try {
    const result = await makeHardcoverRequest(
      token,
      `
        query {
          me {
            id
            username
            cached_image
          }
        }
      `
    );

    // Handle both array and object formats for me (API returns array format)
    const me = result.data?.me;
    let userInfo: { id: string | number; username: string; cachedImageUrl?: string } | null = null;

    if (Array.isArray(me) && me.length > 0) {
      const cachedImage = me[0].cached_image;
      userInfo = {
        id: me[0].id,
        username: me[0].username || 'Unknown',
        cachedImageUrl: cachedImage && typeof cachedImage === 'object' && 'url' in cachedImage 
          ? cachedImage.url 
          : undefined,
      };
    } else if (me && typeof me === 'object' && 'id' in me) {
      const cachedImage = me.cached_image;
      userInfo = {
        id: me.id,
        username: me.username || 'Unknown',
        cachedImageUrl: cachedImage && typeof cachedImage === 'object' && 'url' in cachedImage 
          ? cachedImage.url 
          : undefined,
      };
    }

    if (userInfo) {
      return {
        valid: true,
        user: {
          id: String(userInfo.id),
          username: userInfo.username,
          cachedImageUrl: userInfo.cachedImageUrl,
        },
      };
    }

    return {
      valid: false,
      error: `Unexpected response format. Response: ${JSON.stringify(result).substring(0, 200)}`,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { valid: false, error: errorMsg };
  }
}

/**
 * Introspect GraphQL schema to find query fields
 */
export async function introspectSchema(
  token: string
): Promise<{ success: boolean; queryFields?: string[]; error?: string }> {
  try {
    const result = await makeHardcoverRequest(
      token,
      `
        query IntrospectQueryType {
          __type(name: "query_root") {
            fields {
              name
              args {
                name
                type {
                  name
                  kind
                }
              }
            }
          }
        }
      `
    );

    const fields = result.data?.__type?.fields;
    if (fields && Array.isArray(fields)) {
      const fieldNames = fields.map((f: any) => f.name);
      return { success: true, queryFields: fieldNames };
    }

    return { success: false, error: 'Could not introspect schema' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Introspect a specific field to see its structure and arguments
 */
export async function introspectField(
  token: string,
  fieldName: string
): Promise<{ success: boolean; fieldInfo?: any; error?: string }> {
  try {
    const result = await makeHardcoverRequest(
      token,
      `
        query IntrospectField {
          __type(name: "query_root") {
            fields(includeDeprecated: true) {
              name
              description
              args {
                name
                description
                type {
                  name
                  kind
                  ofType {
                    name
                    kind
                  }
                }
              }
              type {
                name
                kind
                ofType {
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
      const field = fields.find((f: any) => f.name === fieldName);
      if (field) {
        return { success: true, fieldInfo: field };
      }
    }

    return { success: false, error: `Field ${fieldName} not found` };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Introspect the editions type to see what fields it has
 */
export async function introspectEditionsType(
  token: string
): Promise<{ success: boolean; fields?: any[]; error?: string }> {
  try {
    const result = await makeHardcoverRequest(
      token,
      `
        query IntrospectEditionsType {
          __type(name: "editions") {
            fields {
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

    const fields = result.data?.__type?.fields;
    if (fields && Array.isArray(fields)) {
      return { success: true, fields };
    }

    return { success: false, error: 'Could not introspect editions type' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Introspect the editions_bool_exp type to see what filter fields are available
 */
export async function introspectEditionsBoolExp(
  token: string
): Promise<{ success: boolean; fields?: any[]; error?: string }> {
  try {
    const result = await makeHardcoverRequest(
      token,
      `
        query IntrospectEditionsBoolExp {
          __type(name: "editions_bool_exp") {
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

    return { success: false, error: 'Could not introspect editions_bool_exp type' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Lookup book by ISBN to get Hardcover book ID
 * Uses introspection to discover the correct field name
 */
export async function lookupBookByIsbn(
  token: string,
  isbn: string
): Promise<{ success: boolean; bookId?: number; error?: string }> {
  try {
    // First, introspect the editions_bool_exp to see what filter fields are available
    const boolExpInfo = await introspectEditionsBoolExp(token);
    if (boolExpInfo.success && boolExpInfo.fields) {
      const fieldNames = boolExpInfo.fields.map((f: any) => f.name);
      console.log('Editions_bool_exp input fields:', fieldNames);
      
      // Look for ISBN-related fields
      const isbnFields = fieldNames.filter((name: string) => 
        name.toLowerCase().includes('isbn')
      );
      console.log('ISBN-related fields in editions_bool_exp:', isbnFields);
    }

    // Normalize ISBN: remove hyphens and spaces, determine format
    const normalizedIsbn = isbn.replace(/[-\s]/g, '');
    const isbnLength = normalizedIsbn.length;
    
    // Determine which field(s) to try based on ISBN length
    // ISBN-10: 10 digits, ISBN-13: 13 digits
    let isbnFields: string[] = [];
    if (isbnLength === 10) {
      isbnFields = ['isbn_10'];
    } else if (isbnLength === 13) {
      isbnFields = ['isbn_13'];
    } else {
      // Unknown length, try both
      isbnFields = ['isbn_13', 'isbn_10'];
    }
    
    // Try the appropriate ISBN field(s) first
    for (const isbnField of isbnFields) {
      try {
        const result = await makeHardcoverRequest(
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
        
        // If we got results but no book ID, continue to next field
        if (editions && Array.isArray(editions) && editions.length > 0) {
          continue;
        }
      } catch (e) {
        // Continue to next ISBN field variant
        console.log(`Error with editions(where: {${isbnField}: {_eq}}):`, e);
        continue;
      }
    }
    
    // If the specific field didn't work, try both with _or query
    try {
      const result = await makeHardcoverRequest(
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
    } catch (e) {
      console.log('Error with _or query:', e);
    }
    
    return { 
      success: false, 
      error: 'Book not found in Hardcover by ISBN. Tried isbn_10 and isbn_13 fields.' 
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Check if user_book relationship exists
 */
export async function checkUserBookRelationship(
  token: string,
  bookId: number
): Promise<{ success: boolean; exists: boolean; userBookId?: number; error?: string }> {
  try {
    const result = await makeHardcoverRequest(
      token,
      `
        query CheckUserBook($bookId: Int!) {
          user_books(where: {book_id: {_eq: $bookId}}) {
            id
          }
        }
      `,
      { bookId }
    );

    // Handle array format
    const userBooks = result.data?.user_books;
    if (Array.isArray(userBooks) && userBooks.length > 0) {
      const userBook = userBooks[0];
      if (userBook?.id) {
        return { success: true, exists: true, userBookId: userBook.id };
      }
    }

    return { success: true, exists: false };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, exists: false, error: errorMsg };
  }
}

/**
 * Create user_book relationship with rating, status_id, and read_count
 */
export async function createUserBookRelationship(
  token: string,
  bookId: number,
  rating: number
): Promise<{ success: boolean; userBookId?: number; error?: string }> {
  try {
    // Use insert_user_book mutation with rating, status_id: 3, and read_count: 1
    const result = await makeHardcoverRequest(
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

    // Handle array format
    const userBook = Array.isArray(result.data?.insert_user_book)
      ? result.data.insert_user_book[0]
      : result.data?.insert_user_book;

    if (userBook?.id) {
      return { success: true, userBookId: userBook.id };
    }

    return { success: false, error: 'Failed to create user_book relationship' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Introspect mutation_root to find update mutations
 */
export async function introspectMutations(
  token: string
): Promise<{ success: boolean; mutations?: string[]; error?: string }> {
  try {
    const result = await makeHardcoverRequest(
      token,
      `
        query IntrospectMutations {
          __type(name: "mutation_root") {
            fields {
              name
              args {
                name
                type {
                  name
                  kind
                }
              }
            }
          }
        }
      `
    );

    const fields = result.data?.__type?.fields;
    if (fields && Array.isArray(fields)) {
      const mutationNames = fields.map((f: any) => f.name);
      return { success: true, mutations: mutationNames };
    }

    return { success: false, error: 'Could not introspect mutations' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Introspect a specific mutation to see its arguments
 */
export async function introspectMutation(
  token: string,
  mutationName: string
): Promise<{ success: boolean; mutationInfo?: any; error?: string }> {
  try {
    const result = await makeHardcoverRequest(
      token,
      `
        query IntrospectMutation {
          __type(name: "mutation_root") {
            fields(includeDeprecated: true) {
              name
              args {
                name
                description
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

/**
 * Introspect UserBookUpdateInput to see what fields it accepts
 */
export async function introspectUserBookUpdateInput(
  token: string
): Promise<{ success: boolean; fields?: any[]; error?: string }> {
  try {
    const result = await makeHardcoverRequest(
      token,
      `
        query IntrospectUserBookUpdateInput {
          __type(name: "UserBookUpdateInput") {
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

    return { success: false, error: 'Could not introspect UserBookUpdateInput' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Introspect UserBookIdType to see what fields it returns
 */
export async function introspectUserBookIdType(
  token: string
): Promise<{ success: boolean; fields?: any[]; error?: string }> {
  try {
    const result = await makeHardcoverRequest(
      token,
      `
        query IntrospectUserBookIdType {
          __type(name: "UserBookIdType") {
            fields {
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

    const fields = result.data?.__type?.fields;
    if (fields && Array.isArray(fields)) {
      return { success: true, fields };
    }

    return { success: false, error: 'Could not introspect UserBookIdType' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Add rating to user_book relationship
 * Note: update_user_book mutation has issues, so we'll try updating but fall back to recreate if needed
 */
export async function addRatingToUserBook(
  token: string,
  userBookId: number,
  bookId: number,
  rating: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Try update_user_book mutation first
    const result = await makeHardcoverRequest(
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

    // Handle array format
    const updated = Array.isArray(result.data?.update_user_book)
      ? result.data.update_user_book[0]
      : result.data?.update_user_book;

    // Check for errors
    if (updated?.error) {
      // If update fails with "Record not found", the update_user_book mutation has issues
      // Try deleting and recreating the relationship as a workaround
      if (updated.error.includes('not found') || updated.error.includes('deleted')) {
        console.log('Update mutation failed, attempting to delete and recreate user_book...');
        // Delete the existing relationship
        try {
          await makeHardcoverRequest(
            token,
            `
              mutation DeleteUserBook($userBookId: Int!) {
                delete_user_book(id: $userBookId) {
                  id
                }
              }
            `,
            { userBookId }
          );
        } catch (deleteError) {
          // If delete also fails, try to recreate anyway (might fail if relationship still exists)
          console.log('Delete failed, attempting recreate anyway:', deleteError);
        }
        
        // Recreate with rating, status_id, and read_count
        const createResult = await createUserBookRelationship(token, bookId, rating);
        if (createResult.success) {
          return { success: true };
        }
        // If recreate fails, it might be because the relationship still exists
        // In that case, we'll return success anyway since the book is in their library
        if (createResult.error?.includes('already exists') || createResult.error?.includes('duplicate')) {
          console.log('Relationship already exists, update skipped');
          return { success: true };
        }
        return { success: false, error: createResult.error || 'Failed to recreate relationship' };
      }
      return { success: false, error: updated.error };
    }

    // Check if update was successful
    if (updated?.id || updated?.user_book?.id) {
      return { success: true };
    }

    // If we got a result, consider it success
    if (result.data?.update_user_book) {
      return { success: true };
    }

    return { 
      success: false, 
      error: 'Could not update rating.' 
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMsg };
  }
}

/**
 * Sync rating and review to Hardcover
 * This function handles the full flow:
 * 1. Lookup book by ISBN
 * 2. Always create user_book relationship with rating, review (if provided), status_id: 3, and read_count: 1
 * 
 * TODO: Move to update instead of always creating to preserve other book properties
 * (e.g., read dates, notes, etc.) when updating ratings. Currently always creating
 * because update_user_book mutation fails with "Record not found" error.
 */
export async function syncRatingToHardcover(
  token: string,
  isbn: string,
  rating: number,
  reviewText?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Step 1: Lookup book by ISBN
    const bookLookup = await lookupBookByIsbn(token, isbn);
    if (!bookLookup.success || !bookLookup.bookId) {
      return { success: false, error: bookLookup.error || 'Book not found in Hardcover' };
    }

    const bookId = bookLookup.bookId;

    // Step 2: Always create relationship with rating, review (if provided), status_id: 3, and read_count: 1
    // TODO: Check if relationship exists and update instead of always creating
    // to preserve other properties like read dates, notes, etc.
    const createObject: any = {
      book_id: bookId,
      rating: Number(rating),
      status_id: 3,
      read_count: 1
    };

    // Include review if provided
    if (reviewText && reviewText.trim() !== '') {
      createObject.review = reviewText.trim();
    }

    const createResult = await makeHardcoverRequest(
      token,
      `
        mutation CreateUserBook($bookId: Int!, $rating: numeric!${reviewText ? ', $review: String!' : ''}) {
          insert_user_book(object: {book_id: $bookId, rating: $rating${reviewText ? ', review: $review' : ''}, status_id: 3, read_count: 1}) {
            id
          }
        }
      `,
      createObject
    );

    const userBook = Array.isArray(createResult.data?.insert_user_book)
      ? createResult.data.insert_user_book[0]
      : createResult.data?.insert_user_book;

    if (userBook?.id) {
      return { success: true };
    }

    // If creation fails because relationship already exists, that's okay
    if (createResult.errors) {
      const errorMessage = createResult.errors[0]?.message || '';
      if (errorMessage.includes('already exists') || errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
        return { success: true };
      }
    }

    return { success: false, error: 'Failed to create relationship' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    // If error is about duplicate/unique constraint, that's okay
    if (errorMsg.includes('already exists') || errorMsg.includes('duplicate') || errorMsg.includes('unique')) {
      return { success: true };
    }
    return { success: false, error: errorMsg };
  }
}

/**
 * Sync review and rating to Hardcover
 * This function handles the full flow:
 * 1. Lookup book by ISBN
 * 2. Always create user_book relationship with rating, review, status_id: 3, and read_count: 1
 */
export async function syncReviewToHardcover(
  token: string,
  isbn: string,
  reviewText: string,
  rating: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Step 1: Lookup book by ISBN
    const bookLookup = await lookupBookByIsbn(token, isbn);
    if (!bookLookup.success || !bookLookup.bookId) {
      return { success: false, error: bookLookup.error || 'Book not found in Hardcover' };
    }

    const bookId = bookLookup.bookId;

    // Step 2: Always create relationship with rating, review, status_id: 3, and read_count: 1
    const createResult = await makeHardcoverRequest(
      token,
      `
        mutation CreateUserBook($bookId: Int!, $rating: numeric!, $review: String!) {
          insert_user_book(object: {book_id: $bookId, rating: $rating, review: $review, status_id: 3, read_count: 1}) {
            id
          }
        }
      `,
      { bookId, rating: Number(rating), review: reviewText.trim() }
    );

    const userBook = Array.isArray(createResult.data?.insert_user_book)
      ? createResult.data.insert_user_book[0]
      : createResult.data?.insert_user_book;

    if (userBook?.id) {
      return { success: true };
    }

    // If creation fails because relationship already exists, that's okay
    if (createResult.errors) {
      const errorMessage = createResult.errors[0]?.message || '';
      if (errorMessage.includes('already exists') || errorMessage.includes('duplicate') || errorMessage.includes('unique')) {
        return { success: true };
      }
    }

    return { success: false, error: 'Failed to create relationship' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    // If error is about duplicate/unique constraint, that's okay
    if (errorMsg.includes('already exists') || errorMsg.includes('duplicate') || errorMsg.includes('unique')) {
      return { success: true };
    }
    return { success: false, error: errorMsg };
  }
}

