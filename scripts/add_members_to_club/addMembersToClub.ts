const admin = require("firebase-admin");
const fs = require("fs");
const yaml = require("js-yaml");

interface Member {
  id: string;
  name: string;
  avatar?: string;
  role?: "admin" | "member";
}

interface Config {
  clubId: string;
  members: Member[];
}

// --- Load config ---
const configFile = process.argv[2];
if (!configFile) {
  console.error("Usage: ts-node addMembers.ts <members.yaml>");
  process.exit(1);
}
const fileContents = fs.readFileSync(configFile, "utf8");
const config = yaml.load(fileContents) as Config;

// --- Initialize Firebase Admin ---
admin.initializeApp({
  credential: admin.credential.cert("../firebase_sa_key.json"),
  databaseURL: "https://sombk-firebase-free-default-rtdb.firebaseio.com"
});

const db = admin.database();
const clubRef = db.ref(`clubs/${config.clubId}/members`);

async function addMembers() {
  const snapshot = await clubRef.once("value");
  const existingMembers: Member[] = snapshot.val() || [];

  const existingIds = new Set(existingMembers.map(m => m.id));
  const newMembers: Member[] = [];

  for (const member of config.members) {
    if (!existingIds.has(member.id)) {
      existingMembers.push(member);
      newMembers.push(member);
    }
  }

  await clubRef.set(existingMembers);
  console.log(`✅ Added ${newMembers.length} new members. Total now: ${existingMembers.length}`);
  newMembers.forEach(m => console.log(`- ${m.name} (${m.id})`));
  
  // Close the Firebase connection
  await admin.app().delete();
  process.exit(0);
}

addMembers().catch(console.error);
