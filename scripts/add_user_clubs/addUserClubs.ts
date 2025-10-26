import * as admin from "firebase-admin";
import * as fs from "fs";
import * as yaml from "js-yaml";

interface UserClubData {
  userId: string;
  clubs: string[];
  first_name: string;
  last_name: string;
}

interface Config {
  userClubData: UserClubData[];
}

// --- Load config ---
const configFile = process.argv[2];
if (!configFile) {
  console.error("Usage: ts-node addUserClubs.ts <user-clubs.yaml>");
  process.exit(1);
}
const fileContents = fs.readFileSync(configFile, "utf8");
const config = yaml.load(fileContents) as Config;

// --- Initialize Firebase Admin ---
admin.initializeApp({
  credential: admin.credential.cert("../../firebase_sa_key.json"),
  databaseURL: "https://sombk-firebase-free-default-rtdb.firebaseio.com"
});

const db = admin.database();

async function addUserClubs() {
  console.log(`👥 Adding club memberships to user profiles...`);
  
  let updatedUsers = 0;
  
  for (const userData of config.userClubData) {
    const userRef = db.ref(`users/${userData.userId}`);
    
    // Get existing user data
    const userSnapshot = await userRef.once("value");
    const existingUserData = userSnapshot.val() || {};
    
    // Update clubs array and name fields
    existingUserData.clubs = userData.clubs;
    existingUserData.first_name = userData.first_name;
    existingUserData.last_name = userData.last_name;
    
    // Save updated user data
    await userRef.set(existingUserData);
    
    console.log(`✅ Updated user ${userData.userId} with clubs: ${userData.clubs.join(', ')}`);
    updatedUsers++;
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`- Users updated: ${updatedUsers}`);
  console.log(`- Total club memberships: ${config.userClubData.reduce((sum, user) => sum + user.clubs.length, 0)}`);
  
  // Close the Firebase connection
  await admin.app().delete();
  process.exit(0);
}

addUserClubs().catch(console.error);
