# Seed Clubs with Data Script

This script automatically generates and seeds multiple book clubs with varying members, personalities, ratings, reviews, and current reading progress.

## Prerequisites

1. **Firebase Service Account Key**: Place your Firebase service account JSON file as `firebase_sa_key.json` in the project root directory
2. **Node.js Dependencies**: Install required packages by running `npm install` in the `scripts/` directory

## Usage

```bash
# From bookclurb root directory
cd scripts
ts-node seed_clubs/seedClubsWithData.ts
```

## What It Does

The script automatically generates **6 different book clubs** with:

- **Varying member counts**: 5-15 members per club
- **Different personalities**: Academic, Casual, Diverse, Mixed (Sci-Fi/Fantasy, Mystery, Historical)
- **All public clubs**: All clubs are set to `isPublic: true`
- **Books read**: Each club has 5-10 previously read books
- **Ratings**: 70-90% of readers rate each book (1-5 stars)
- **Reviews**: 50% of readers who rate also write reviews
- **Current books**: Each club has a current book with:
  - Reading progress (percentage, current pages, total pages)
  - Reading schedule (weekly meetings over 8-12 weeks)
- **On deck books**: Each club has a book selected for next reading

## Generated Clubs

1. **The Literary Scholars** (12 members, Academic)
   - Focus on classic literature and deep analysis
   - 8 books read

2. **Weekend Readers** (7 members, Casual)
   - Relaxed, fun atmosphere
   - 6 books read

3. **Global Voices Book Club** (15 members, Diverse)
   - Diverse authors and perspectives
   - 10 books read

4. **Fantasy & Sci-Fi Enthusiasts** (9 members, Mixed)
   - Fantasy and science fiction focus
   - 7 books read

5. **The Mystery Solvers** (5 members, Mixed)
   - Small, tight-knit mystery/thriller group
   - 5 books read

6. **History Through Pages** (11 members, Academic)
   - Historical fiction focus
   - 9 books read

## Generated Data Details

### Members
- Randomly generated names from a pool of first and last names
- First member is always an admin
- Avatar images generated using DiceBear API
- Random join dates (90-365 days ago)

### Books
- Selected from a curated list of 30 classic and popular books
- Each book includes ISBN and cover URL (from Open Library)
- Books are distributed across different time periods

### Ratings
- Ratings vary by club personality:
  - Academic: 3-5 stars (more critical)
  - Casual: 4-5 stars (more positive)
  - Diverse: 2-5 stars (wide range)
  - Mixed: 3-5 stars (balanced)

### Reviews
- Generated from a pool of 15 review templates
- 50% chance that a member who rates also writes a review

### Reading Progress
- Current pages: 20-80% through the book
- Total pages: 250-700 pages
- Reading schedule: Weekly meetings over 8-12 weeks

## Output

The script displays detailed information for each created club:
- Club ID
- Member count
- Number of books read
- Current book title
- On deck book title
- Total ratings and reviews
- Current reading progress

Example output:
```
📚 Creating club: The Literary Scholars (academic)
  ✅ Created club with ID: -NxYz123abc
  👥 Members: 12
  📖 Books read: 8
  📊 Current book: The Great Gatsby
  📋 On deck: To Kill a Mockingbird
  ⭐ Ratings: 45, 💬 Reviews: 22
  📈 Progress: 42% (168/400 pages)
```

## Note on User IDs

The script generates placeholder user IDs in the format `seed_user_{index}_{random}`. These are not real Firebase Auth user IDs. To link clubs to real users, you'll need to:

1. Update the member IDs in the database to match actual Firebase Auth user IDs
2. Or create corresponding user accounts with these IDs

## Database Structure

Clubs are created at `clubs/{clubId}` with the following structure:
- `name`: Club name
- `description`: Club description
- `coverColor`: Hex color for club cover
- `isPublic`: true (all clubs are public)
- `memberCount`: Number of members
- `members`: Array of member objects with bookData
- `booksRead`: Array of books with ratings and reviews
- `currentBook`: Current reading with progress and schedule
- `onDeckBook`: Next book to read
- `recentActivity`: Empty array (ready for future activity)

