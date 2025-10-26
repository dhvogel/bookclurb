const admin = require("firebase-admin");
const fs = require("fs");
const yaml = require("js-yaml");

// Isolate scope to prevent global variable conflicts
export {};

interface OverviewData {
  currentBook?: {
    title: string;
    author?: string;
    isbn?: string;
    coverUrl?: string;
  };
  nextMeeting?: {
    timestamp: string;
    timeZone: string;
    location?: string;
  };
  recentActivity?: Array<{
    id: string;
    type: 'discussion' | 'meeting' | 'book_change' | 'member_join';
    title: string;
    author: string;
    timestamp: string;
    content?: string;
  }>;
}

interface Config {
  clubId: string;
  overviewData: OverviewData;
}

// --- Load config ---
const overviewConfigFile = process.argv[2];
if (!overviewConfigFile) {
  console.error("Usage: ts-node addOverviewData.ts <overview.yaml>");
  process.exit(1);
}
const fileContents = fs.readFileSync(overviewConfigFile, "utf8");
const config = yaml.load(fileContents) as Config;

// --- Initialize Firebase Admin ---
admin.initializeApp({
  credential: admin.credential.cert("../firebase_sa_key.json"),
  databaseURL: "https://sombk-firebase-free-default-rtdb.firebaseio.com"
});

const db = admin.database();

async function addOverviewData() {
  console.log(`📊 Adding overview data to club ${config.clubId}...`);
  
  // Get existing club data
  const clubRef = db.ref(`clubs/${config.clubId}`);
  const clubSnapshot = await clubRef.once("value");
  const clubData = clubSnapshot.val();
  
  if (!clubData) {
    console.error(`❌ Club ${config.clubId} not found!`);
    process.exit(1);
  }

  // Update overview data
  const updates: any = {};
  
  if (config.overviewData.currentBook) {
    updates.currentBook = config.overviewData.currentBook;
    console.log(`✅ Added current book: ${config.overviewData.currentBook.title}`);
  }
  
  if (config.overviewData.nextMeeting) {
    updates.nextMeeting = config.overviewData.nextMeeting;
    console.log(`✅ Added next meeting: ${config.overviewData.nextMeeting.timestamp}`);
  }
  
  if (config.overviewData.recentActivity) {
    updates.recentActivity = config.overviewData.recentActivity;
    console.log(`✅ Added ${config.overviewData.recentActivity.length} recent activities`);
  }

  // Apply updates
  await clubRef.update(updates);
  
  console.log(`\n📊 Summary:`);
  console.log(`- Current book: ${config.overviewData.currentBook ? 'Added' : 'Not provided'}`);
  console.log(`- Next meeting: ${config.overviewData.nextMeeting ? 'Added' : 'Not provided'}`);
  console.log(`- Recent activities: ${config.overviewData.recentActivity?.length || 0} items`);
  
  // Close the Firebase connection
  await admin.app().delete();
  process.exit(0);
}

addOverviewData().catch(console.error);
