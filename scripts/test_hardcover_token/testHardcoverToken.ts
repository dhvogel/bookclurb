#!/usr/bin/env node

/**
 * Test Hardcover API Token
 * 
 * This script tests whether a Hardcover API token is valid by making
 * a GraphQL query to the Hardcover API.
 * 
 * Usage:
 *   ts-node testHardcoverToken.ts <token>
 *   or
 *   ts-node testHardcoverToken.ts --token <token>
 */

const HARDCOVER_API_URL = 'https://api.hardcover.app/v1/graphql';

interface HardcoverMeResponse {
  data?: {
    me?: {
      id: string;
      username: string;
    } | Array<{
      id: number;
      username: string;
    }>;
  };
  errors?: Array<{
    message: string;
    extensions?: {
      code?: string;
    };
  }>;
}

async function testHardcoverToken(token: string): Promise<{ valid: boolean; user?: { id: string; username: string }; error?: string }> {
  try {
    // Strip "Bearer " prefix if user included it
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
    
    const response = await fetch(HARDCOVER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanToken}`,
      },
      body: JSON.stringify({
        query: `
          query {
            me {
              id
              username
            }
          }
        `,
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
            errorText += ` - ${JSON.stringify(errorBody.errors)}`;
          } else if (errorBody.message) {
            errorText += ` - ${errorBody.message}`;
          } else {
            errorText += ` - ${JSON.stringify(errorBody).substring(0, 200)}`;
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
      
      return {
        valid: false,
        error: errorText,
      };
    }

    if (!contentType?.includes('application/json')) {
      const textBody = await response.text();
      return {
        valid: false,
        error: `Expected JSON but got ${contentType}. Response: ${textBody.substring(0, 200)}`,
      };
    }

    const result: HardcoverMeResponse = await response.json();

    if (result.errors) {
      const errorMessages = result.errors.map(e => e.message).join(', ');
      return {
        valid: false,
        error: errorMessages,
      };
    }

    // Handle both array and object formats for me
    const me = result.data?.me;
    let userInfo: { id: string | number; username: string } | null = null;

    if (Array.isArray(me) && me.length > 0) {
      userInfo = {
        id: me[0].id,
        username: me[0].username || 'Unknown',
      };
    } else if (me && typeof me === 'object' && 'id' in me) {
      userInfo = {
        id: me.id,
        username: me.username || 'Unknown',
      };
    }

    if (userInfo) {
      return {
        valid: true,
        user: {
          id: String(userInfo.id),
          username: userInfo.username,
        },
      };
    }

    return {
      valid: false,
      error: `Unexpected response format. Response: ${JSON.stringify(result).substring(0, 200)}`,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function main() {
  // Parse command line arguments
  let token: string | undefined;

  // Check for --token flag or use first argument
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('❌ Error: No token provided');
    console.log('\nUsage:');
    console.log('  ts-node testHardcoverToken.ts <token>');
    console.log('  ts-node testHardcoverToken.ts --token <token>');
    console.log('\nExample:');
    console.log('  ts-node testHardcoverToken.ts your-api-token-here');
    process.exit(1);
  }

  if (args[0] === '--token' || args[0] === '-t') {
    token = args[1];
  } else {
    token = args[0];
  }

  if (!token) {
    console.error('❌ Error: Token is empty');
    process.exit(1);
  }

  console.log('🔍 Testing Hardcover API token...\n');

  const result = await testHardcoverToken(token);

  if (result.valid && result.user) {
    console.log('✅ Token is valid!');
    console.log(`   User ID: ${result.user.id}`);
    console.log(`   Username: ${result.user.username}`);
    console.log('\n🎉 Your Hardcover account is ready for integration!');
    process.exit(0);
  } else {
    console.log('❌ Token is invalid or error occurred');
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log('\n💡 Make sure you:');
    console.log('   1. Copied the token correctly from https://hardcover.app/settings/api');
    console.log('   2. The token hasn\'t expired');
    console.log('   3. You have an active Hardcover account');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

