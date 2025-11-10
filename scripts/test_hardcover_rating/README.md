# Test Hardcover Rating Sync

This script tests the full flow of syncing a rating to Hardcover:
1. Lookup book by ISBN to get Hardcover book ID
2. Check if user_book relationship exists
3. Create it if it doesn't exist
4. Add rating to the relationship

## Usage

```bash
# From the scripts directory
ts-node test_hardcover_rating/testHardcoverRating.ts <token> <isbn> <rating>

# Or with named arguments
ts-node test_hardcover_rating/testHardcoverRating.ts --token <token> --isbn <isbn> --rating <rating>
```

## Example

```bash
ts-node test_hardcover_rating/testHardcoverRating.ts your-api-token 9781234567890 5
```

## Arguments

- **token** (required): Your Hardcover API token
- **isbn** (required): ISBN of the book (10 or 13 digits, with or without hyphens)
- **rating** (required): Rating value (1-5)

## Output

### Success
```
🔍 Testing Hardcover rating sync...

📚 ISBN: 9781234567890
⭐ Rating: 5

Step 1: Looking up book by ISBN...
✅ Found book ID: 12345

Step 2: Checking if user_book relationship exists...
✅ User_book relationship exists (ID: 67890)

Step 3: Adding rating 5 to user_book (ID: 67890)...
✅ Successfully added rating!

🎉 Rating sync completed successfully!
   Book ID: 12345
   User Book ID: 67890
   Rating: 5
```

### Creating New Relationship
```
🔍 Testing Hardcover rating sync...

📚 ISBN: 9781234567890
⭐ Rating: 4

Step 1: Looking up book by ISBN...
✅ Found book ID: 12345

Step 2: Checking if user_book relationship exists...
⚠️  User_book relationship does not exist. Creating...
✅ Created user_book relationship (ID: 67890)

Step 3: Adding rating 4 to user_book (ID: 67890)...
✅ Successfully added rating!

🎉 Rating sync completed successfully!
   Book ID: 12345
   User Book ID: 67890
   Rating: 4
```

### Failure
```
🔍 Testing Hardcover rating sync...

📚 ISBN: 9781234567890
⭐ Rating: 5

Step 1: Looking up book by ISBN...
❌ Failed to lookup book: Book not found in Hardcover
```

## What It Tests

The script performs the exact same flow as the web app:
1. **Book Lookup**: Finds the Hardcover book ID by ISBN (handles both ISBN-10 and ISBN-13)
2. **Relationship Check**: Verifies if you already have a user_book relationship for this book
3. **Create Relationship**: Creates the relationship if it doesn't exist
4. **Add Rating**: Updates the user_book with your rating

This is useful for:
- Testing the API integration outside the web app
- Debugging rating sync issues
- Verifying your token has the correct permissions
- Testing with different ISBNs and ratings

