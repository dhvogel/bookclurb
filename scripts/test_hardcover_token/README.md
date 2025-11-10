# Test Hardcover API Token

This script tests whether a Hardcover API token is valid by making a GraphQL query to the Hardcover API.

## Usage

```bash
# From the scripts directory
ts-node test_hardcover_token/testHardcoverToken.ts <token>

# Or with the --token flag
ts-node test_hardcover_token/testHardcoverToken.ts --token <token>
```

## Example

```bash
ts-node test_hardcover_token/testHardcoverToken.ts your-api-token-here
```

## Output

### Success
```
🔍 Testing Hardcover API token...

✅ Token is valid!
   User ID: abc123
   Username: johndoe

🎉 Your Hardcover account is ready for integration!
```

### Failure
```
🔍 Testing Hardcover API token...

❌ Token is invalid or error occurred
   Error: Invalid token

💡 Make sure you:
   1. Copied the token correctly from https://hardcover.app/settings/api
   2. The token hasn't expired
   3. You have an active Hardcover account
```

## Getting Your Token

1. Go to [Hardcover Settings](https://hardcover.app/settings/api)
2. Copy your API token
3. Run this script with your token to verify it works

## What It Tests

The script makes a GraphQL query to the `me` endpoint, which retrieves your user information. If the token is valid, it will return your user ID and username.


