# Add Books to Club Script

This script adds books to a club's reading history and populates member book data. It follows the same pattern as the `add_members_to_club` script.

## Usage

```bash
cd scripts/add_books_to_club
ts-node addBooksToClub.ts books.yaml
```

## Configuration File Format

The script expects a YAML configuration file with the following structure:

```yaml
clubId: "bookclubid1"

# Books that the club has read
booksRead:
  - title: "Book Title"
    author: "Author Name"
    isbn: "9781234567890"
    coverUrl: "https://example.com/cover.jpg"
    readBy: ["Member1", "Member2", "Member3"]
    completedAt: "2024-01-15"

# Member book data - maps memberId to their reading history
memberBookData:
  "memberId1":
    - title: "Book Title"
      read: true
    - title: "Another Book"
      read: false
      halfCredit: true
```

## What the Script Does

1. **Updates Club Books**: Adds books to the club's `booksRead` array
2. **Updates Member Data**: Populates each member's `bookData` array with their reading history
3. **Merges Data**: Safely merges new data with existing data (won't overwrite existing entries)
4. **Provides Summary**: Shows statistics about books added and member reading progress

## Features

- **Safe Merging**: Won't overwrite existing book or member data
- **Comprehensive Stats**: Shows reading statistics for all members
- **Error Handling**: Validates club exists before making changes
- **Detailed Logging**: Shows exactly what was added/updated

## Example Output

```
📚 Adding books to club bookclubid1...
✅ Updated booksRead. Total books: 9
- Tale of Two Cities by Charles Dickens
- Grapes of Wrath by John Steinbeck
- Socialism by Ludwig von Mises
...

✅ Updated bookData for 8 members

📊 Summary:
- Books in club: 9
- Members with updated bookData: 8

👥 Member Reading Stats:
- Member1: 2 books read
- Member2: 9 books read
- Member3: 9 books read
- Member4: 4 books read
- Member5: 5 books read
- Member6: 4 books read
- Member7: 1 books read
- Member8: 1 books read
```

## Prerequisites

- Node.js and TypeScript
- Firebase Admin SDK credentials (`firebase_sa_key.json`)
- Access to the Firebase database

## File Structure

```
scripts/add_books_to_club/
├── addBooksToClub.ts    # Main script
├── books.yaml          # Sample configuration
└── README.md           # This file
```
