# Migrate Reflections to Club Structure

This script migrates reflections from the old `reflections/{userId}/{meetingId}` structure to a new club-based structure where reflections are stored directly in the club data as `clubs/{clubId}/meetings/{meetingId}/reflections`.

## Why This Migration?

The old structure had several issues:
- **Separate collections**: Reflections were stored separately from club data
- **Inefficient queries**: Required multiple Firebase calls to get reflections for a club
- **Complex data fetching**: DiscussionsTab had to fetch from multiple paths
- **Poor organization**: Reflections weren't logically grouped with their clubs

The new structure is better because:
- **Single source of truth**: All club data (including reflections) in one place
- **Efficient queries**: One Firebase call gets all club data including reflections
- **Better organization**: Reflections are logically grouped with meetings
- **Simpler code**: DiscussionsTab can get all data from the club object

## Prerequisites

1. **Firebase Service Account Key**: Place your Firebase service account JSON file as `firebase_sa_key.json` in the project root directory
2. **Node.js Dependencies**: Install required packages by running `npm install` in the `scripts/` directory

## Usage

```bash
# From bookclurb root directory
cd scripts/migrate_reflections
npx ts-node migrateReflections.ts
```

## What This Script Does

1. **Fetches Old Data**: Gets all reflections from `reflections/{userId}/{meetingId}`
2. **Gets User Names**: Maps user IDs to names from `users/{userId}`
3. **Gets Club Data**: Fetches all clubs to update their structure
4. **Creates Meetings Structure**: Adds meetings array to each club
5. **Migrates Reflections**: Moves reflections to `clubs/{clubId}/meetings/{meetingId}/reflections`
6. **Preserves Old Data**: Keeps old structure for safety (can be removed manually)

## New Data Structure

### Before (Old Structure)
```
reflections/
  {userId}/
    {meetingId}/
      reflection: "Reflection text..."
      timestamp: 1730329200000
```

### After (New Structure)
```
clubs/
  {clubId}/
    meetings/
      - id: "meeting-2025-10-30"
        time: "Thu, 10/30, 6:00 PM EDT"
        reading: "Empire of Pain, Ch 26-End"
        date: "2025-10-30"
        status: "current"
        reflections:
          - userId: "VdGhXfiuZsXnew3sJvYBnpgpOhB2"
            userName: "User1"
            reflection: "This week's reading really opened my eyes..."
            timestamp: 1730329200000
          - userId: "RAldS1WVb7Q8q9LIEKfIUbHCC142"
            userName: "User2"
            reflection: "I was struck by how the book shows..."
            timestamp: 1730332800000
```

## Example Output

```
🔄 Migrating reflections from old structure to club-based structure...
📖 Fetching reflections from old structure...
👥 Fetching user data for name mapping...
🏛️ Fetching club data...

🏛️ Processing club: bookclubid1
✅ Updated club bookclubid1 with 6 meetings containing reflections

📊 Migration Summary:
- Clubs updated: 1
- Reflections migrated: 11
- Meetings structure added to all clubs

⚠️ Note: Old reflections structure preserved for safety. You can remove it manually after testing.
```

## Safety Features

- **Non-destructive**: Old data is preserved during migration
- **Error handling**: Script handles missing data gracefully
- **Rollback capability**: Old structure can be restored if needed
- **Validation**: Checks for data integrity during migration

## After Migration

1. **Update DiscussionsTab**: Modify the component to use club.meetings instead of separate reflections queries
2. **Test functionality**: Verify that reflections display correctly
3. **Remove old data**: Once confirmed working, remove the old `reflections/` structure
4. **Update save logic**: Modify reflection saving to write to club.meetings structure

## Benefits

- **Better Performance**: Single query instead of multiple Firebase calls
- **Cleaner Code**: Simpler data access patterns
- **Better UX**: Faster loading of discussions
- **Logical Organization**: Reflections grouped with their meetings
- **Easier Maintenance**: All club data in one place
