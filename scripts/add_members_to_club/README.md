# Add Members to Club Script

This script adds members to a Firebase Realtime Database club using a YAML configuration file.

## Prerequisites

1. **Firebase Service Account Key**: Place your Firebase service account JSON file as `firebase_sa_key.json` in the project root directory
2. **Node.js Dependencies**: Install required packages by running `npm install` in the `scripts/` directory

## Usage

```bash
# From bookclurb root directory
cd scripts
npm run add-members add_members_to_club/members.yaml
```

## Configuration File Format

Create a YAML file (e.g., `members.yaml`) with the following structure:

```yaml
clubId: "your-club-id"

members:
  - id: "user001"
    name: "Alice Johnson"
    avatar: "https://example.com/alice.png"
    role: "member"
  - id: "user002"
    name: "Bob Smith"
    avatar: "https://example.com/bob.png"
    role: "admin"
```

### Configuration Fields

- **`clubId`** (required): The Firebase club ID where members will be added
- **`members`** (required): Array of member objects with:
  - **`id`** (required): Unique identifier for the member
  - **`name`** (required): Display name of the member
  - **`avatar`** (optional): URL to member's avatar image
  - **`role`** (optional): Either "admin" or "member" (defaults to "member")

## Behavior

- **Duplicate Prevention**: The script checks for existing members by ID and only adds new ones
- **Non-destructive**: Existing members are preserved, only new members are added
- **Database Path**: Members are stored at `clubs/{clubId}/members` in Firebase Realtime Database

## Output

The script will display:
- Number of new members added
- Total member count after addition
- List of newly added members with their names and IDs

Example output:
```
✅ Added 2 new members. Total now: 5
- Alice Johnson (user001)
- Bob Smith (user002)
```

## Error Handling

- Missing configuration file will show usage instructions
- Invalid Firebase credentials will display authentication errors
- Database connection issues will be logged to console
