# Add User Clubs Script

This script creates user profiles in Firebase Realtime Database with their club memberships. This is the missing piece that allows logged-in users to see their clubs.

## Prerequisites

1. **Firebase Service Account Key**: Place your Firebase service account JSON file as `firebase_sa_key.json` in the project root directory
2. **Node.js Dependencies**: Install required packages by running `npm install` in the `scripts/` directory

## Usage

```bash
# From bookclurb root directory
cd scripts/add_user_clubs
ts-node addUserClubs.ts user-clubs.yaml
```

## Configuration File Format

Create a YAML file (e.g., `user-clubs.yaml`) with the following structure:

```yaml
userClubData:
  - userId: "firebase-user-id-1"
    clubs: ["club1", "club2"]
    first_name: "User1"
    last_name: "LastName"
  - userId: "firebase-user-id-2"
    clubs: ["club1"]
    first_name: "User2"
    last_name: "LastName"
```

### Configuration Fields

- **`userClubData`** (required): Array of user club data objects with:
  - **`userId`** (required): Firebase user ID (from Firebase Auth)
  - **`clubs`** (required): Array of club IDs that the user belongs to
  - **`first_name`** (required): User's first name (used in reflections)
  - **`last_name`** (optional): User's last name (used in reflections)

## What This Script Does

1. **Creates User Profiles**: Creates user data at `users/{userId}` in Firebase
2. **Adds Club Memberships**: Sets the `clubs` array for each user
3. **Adds Name Fields**: Sets `first_name` and `last_name` for reflections display
4. **Enables Club Visibility**: Allows the Clubs component to show user's clubs when logged in
5. **Enables Reflections**: Allows the DiscussionsTab to display user names in reflections

## Database Structure

The script creates the following structure in Firebase:

```
users/
  {userId}/
    clubs: ["club1", "club2", ...]
    first_name: "User1"
    last_name: "LastName"
```

## Example Output

```
👥 Adding club memberships to user profiles...
✅ Updated user VdGhXfiuZsXnew3sJvYBnpgpOhB2 with clubs: bookclubid1
✅ Updated user RAldS1WVb7Q8q9LIEKfIUbHCC142 with clubs: bookclubid1
...

📊 Summary:
- Users updated: 9
- Total club memberships: 9
```

## Error Handling

- Missing configuration file will show usage instructions
- Invalid Firebase credentials will display authentication errors
- Database connection issues will be logged to console

## Why This Script is Needed

The Clubs component looks for user data at `users/{user.uid}` with a `clubs` array to determine which clubs a logged-in user belongs to. Without this data structure, logged-in users see no clubs even if they are members of clubs.

This script bridges the gap between:
- Club membership data (stored at `clubs/{clubId}/members`)
- User club data (stored at `users/{userId}/clubs`)
