# Seed Private Clubs Script

This script automatically generates and seeds multiple **private** book clubs with varying members, personalities, ratings, reviews, and current reading progress.

## Prerequisites

1. **Firebase Service Account Key**: Place your Firebase service account JSON file as `firebase_sa_key.json` in the project root directory
2. **Node.js Dependencies**: Install required packages by running `npm install` in the `scripts/` directory

## Usage

```bash
# From bookclurb root directory
cd scripts
npm run seed-private-clubs

# Or directly with ts-node
ts-node seed_clubs/seedPrivateClubs.ts
```

## What It Does

The script automatically generates **6 different private book clubs** with:

- **Varying member counts**: 3-8 members per club (smaller than public clubs)
- **Different personalities**: Academic, Casual, Mixed
- **All private clubs**: All clubs are set to `isPublic: false` (not visible on public clubs page)
- **Books read**: Each club has 3-8 previously read books
- **Ratings**: 70-90% of readers rate each book (1-5 stars)
- **Reviews**: 50% of readers who rate also write reviews
- **Current books**: Each club has a current book with:
  - Reading progress (percentage, current pages, total pages)
  - Reading schedule (weekly meetings over 8-12 weeks)
- **On deck books**: Each club has a book selected for next reading

## Generated Private Clubs

1. **The Johnson Family Book Club** (4 members, Casual)
   - A private book club for family members
   - 5 books read

2. **Acme Corp Book Club** (6 members, Mixed)
   - A private book club for work colleagues
   - 4 books read

3. **The Bookworms** (5 members, Casual)
   - A private book club for close friends
   - 6 books read

4. **Maple Street Readers** (8 members, Mixed)
   - A private neighborhood book club
   - 7 books read

5. **Class of 2015 Book Club** (7 members, Academic)
   - A private college alumni book club
   - 8 books read

6. **Literary Analysis Group** (3 members, Academic)
   - A small, private study group focused on deep literary analysis
   - 3 books read

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
- Privacy status (Private)
- Member count
- Number of books read
- Current book title
- On deck book title
- Total ratings and reviews
- Current reading progress

Example output:
```
📚 Creating private club: The Johnson Family Book Club (casual)
  ✅ Created private club with ID: -NxYz123abc
  🔒 Privacy: Private (not visible on public clubs page)
  👥 Members: 4
  📖 Books read: 5
  📊 Current book: The Great Gatsby
  📋 On deck: To Kill a Mockingbird
  ⭐ Ratings: 18, 💬 Reviews: 9
  📈 Progress: 55% (165/300 pages)
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
- `isPublic`: **false** (all clubs are private)
- `memberCount`: Number of members
- `members`: Array of member objects with bookData
- `booksRead`: Array of books the club has read
- `currentBook`: Current book being read (optional)
- `onDeckBook`: Next book to be read (optional)
- `recentActivity`: Array of recent activities (empty initially)

## Differences from Public Clubs

- **Privacy**: All clubs have `isPublic: false`
- **Size**: Generally smaller clubs (3-8 members vs 5-15 for public)
- **Themes**: Focused on private groups (family, work, friends, neighborhood, alumni, study groups)
- **Not discoverable**: These clubs will not appear on the public clubs page


