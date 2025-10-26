import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

export {};

interface ClubBasicInfo {
  name: string;
  description?: string;
  coverColor?: string;
  coverImage?: string;
}

interface Config {
  clubId: string;
  basicInfo: ClubBasicInfo;
}

// Get config file path from command line arguments
const configFile = process.argv[2];
if (!configFile) {
  console.log('Usage: ts-node addClubBasicInfo.ts <config-file>');
  console.log('Example: ts-node addClubBasicInfo.ts club-basic-info.yaml');
  process.exit(1);
}

// Load configuration
let config: Config;
try {
  const fileContents = fs.readFileSync(configFile, 'utf8');
  config = yaml.load(fileContents) as Config;
} catch (error) {
  console.error('Error loading config file:', error);
  process.exit(1);
}

// Initialize Firebase Admin
const serviceAccount = require('../../firebase_sa_key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://sombk-firebase-free-default-rtdb.firebaseio.com"
});

const db = admin.database();

async function addClubBasicInfo() {
  console.log(`📋 Adding basic info to club ${config.clubId}...`);
  
  // Get existing club data
  const clubRef = db.ref(`clubs/${config.clubId}`);
  const clubSnapshot = await clubRef.once("value");
  const clubData = clubSnapshot.val();
  
  if (!clubData) {
    console.error(`❌ Club ${config.clubId} not found!`);
    process.exit(1);
  }

  // Update basic club info
  const updates: any = {};
  
  if (config.basicInfo.name) {
    updates.name = config.basicInfo.name;
    console.log(`✅ Added club name: ${config.basicInfo.name}`);
  }
  
  if (config.basicInfo.description) {
    updates.description = config.basicInfo.description;
    console.log(`✅ Added club description: ${config.basicInfo.description}`);
  }
  
  if (config.basicInfo.coverColor) {
    updates.coverColor = config.basicInfo.coverColor;
    console.log(`✅ Added cover color: ${config.basicInfo.coverColor}`);
  }
  
  if (config.basicInfo.coverImage) {
    updates.coverImage = config.basicInfo.coverImage;
    console.log(`✅ Added cover image: ${config.basicInfo.coverImage}`);
  }

  // Apply updates
  await clubRef.update(updates);
  
  console.log(`\n📋 Summary:`);
  console.log(`- Club name: ${config.basicInfo.name ? 'Added' : 'Not provided'}`);
  console.log(`- Description: ${config.basicInfo.description ? 'Added' : 'Not provided'}`);
  console.log(`- Cover color: ${config.basicInfo.coverColor ? 'Added' : 'Not provided'}`);
  console.log(`- Cover image: ${config.basicInfo.coverImage ? 'Added' : 'Not provided'}`);
  
  // Close the Firebase connection
  await admin.app().delete();
  process.exit(0);
}

addClubBasicInfo().catch(console.error);
