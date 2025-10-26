const admin = require("firebase-admin");
const fs = require("fs");
const yaml = require("js-yaml");

// Isolate scope to prevent global variable conflicts
export {};

interface BookRead {
  title: string;
  author?: string;
  isbn?: string;
  coverUrl?: string;
  readBy: string[]; // Array of user IDs who read this book
  completedAt?: string; // When the club finished reading this book
}

interface MemberBookData {
  title: string;
  read: boolean;
  halfCredit?: boolean;
}

interface Member {
  id: string;
  name: string;
  avatar?: string;
  role?: "admin" | "member";
  bookData?: MemberBookData[];
}

interface Config {
  clubId: string;
  booksRead: BookRead[];
  memberBookData: Record<string, MemberBookData[]>; // memberId -> bookData
}

// --- Load config ---
const configFile = process.argv[2];
if (!configFile) {
  console.error("Usage: ts-node addBooksToClub.ts <books.yaml>");
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

async function addBooksToClub() {
  console.log(`📚 Adding books to club ${config.clubId}...`);
  
  // Get existing club data
  const clubRef = db.ref(`clubs/${config.clubId}`);
  const clubSnapshot = await clubRef.once("value");
  const clubData = clubSnapshot.val();
  
  if (!clubData) {
    console.error(`❌ Club ${config.clubId} not found!`);
    process.exit(1);
  }

  // Update booksRead
  const booksReadRef = clubRef.child("booksRead");
  const existingBooksSnapshot = await booksReadRef.once("value");
  const existingBooks: BookRead[] = existingBooksSnapshot.val() || [];
  
  // Merge new books with existing ones
  const bookMap = new Map<string, BookRead>();
  
  // Add existing books
  existingBooks.forEach(book => {
    bookMap.set(book.title, book);
  });
  
  // Add new books
  config.booksRead.forEach(book => {
    bookMap.set(book.title, book);
  });
  
  const updatedBooks = Array.from(bookMap.values());
  await booksReadRef.set(updatedBooks);
  
  console.log(`✅ Updated booksRead. Total books: ${updatedBooks.length}`);
  config.booksRead.forEach(book => {
    console.log(`- ${book.title} by ${book.author || 'Unknown'}`);
  });

  // Update member bookData
  const membersRef = clubRef.child("members");
  const membersSnapshot = await membersRef.once("value");
  const members: Member[] = membersSnapshot.val() || [];
  
  console.log(`📋 Found ${members.length} members in club`);
  
  let updatedMembers = 0;
  
  for (const member of members) {
    if (!member) {
      console.log(`⚠️ Skipping null/undefined member`);
      continue;
    }
    if (!member.id) {
      console.log(`⚠️ Skipping member without ID: ${member.name || 'Unknown'}`);
      continue;
    }
    const memberBookData = config.memberBookData[member.id];
    if (memberBookData) {
      // Merge existing bookData with new data
      const existingBookData = member.bookData || [];
      const bookDataMap = new Map<string, MemberBookData>();
      
      // Add existing bookData
      existingBookData.forEach(book => {
        bookDataMap.set(book.title, book);
      });
      
      // Add/update with new bookData
      memberBookData.forEach(book => {
        bookDataMap.set(book.title, book);
      });
      
      member.bookData = Array.from(bookDataMap.values());
      updatedMembers++;
    }
  }
  
  // Save updated members
  await membersRef.set(members);
  
  console.log(`✅ Updated bookData for ${updatedMembers} members`);
  
  // Show summary
  console.log("\n📊 Summary:");
  console.log(`- Books in club: ${updatedBooks.length}`);
  console.log(`- Members with updated bookData: ${updatedMembers}`);
  
  // Show member reading stats
  const memberStats = members.map(member => {
    const readCount = member.bookData?.filter(book => book.read).length || 0;
    return `${member.name}: ${readCount} books read`;
  });
  
  console.log("\n👥 Member Reading Stats:");
  memberStats.forEach(stat => console.log(`- ${stat}`));
  
  // Close the Firebase connection
  await admin.app().delete();
  process.exit(0);
}

addBooksToClub().catch(console.error);
