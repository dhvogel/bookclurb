const admin = require("firebase-admin");
const fs = require("fs");
const yaml = require("js-yaml");

export {};

interface Member {
  id: string;
  name: string;
  avatar?: string;
  img?: string;
  role?: "admin" | "member";
  joinedAt?: string;
  bookData?: Array<{
    title: string;
    read: boolean;
    halfCredit?: boolean;
  }>;
}

interface BookRead {
  title: string;
  author?: string;
  isbn?: string;
  coverUrl?: string;
  readBy: string[]; // Array of member names who read this book
  completedAt?: string;
  ratings?: Record<string, number>; // Map of userId to rating (1-5)
  reviews?: Record<string, string>; // Map of userId to review text
}

interface ClubSeed {
  name: string;
  description: string;
  coverColor: string;
  coverImage?: string;
  personality: string;
  memberCount: number;
  members: Member[];
  booksRead: BookRead[];
  currentBook?: {
    title: string;
    author?: string;
    isbn?: string;
    coverUrl?: string;
    pageCount?: number;
    progress?: {
      percentage?: number;
      currentPages?: number;
      totalPages?: number;
    };
    schedule?: Array<{
      date: string;
      pages?: number;
      chapter?: number;
    }>;
  };
  onDeckBook?: {
    title: string;
    author?: string;
    isbn?: string;
    coverUrl?: string;
  };
}

interface Config {
  clubs: ClubSeed[];
}

// Helper function to generate a random number between min and max
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to pick a random element from an array
function randomElement<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)];
}

// Generate sample review text
const reviewTemplates = [
  "This book really resonated with me. The characters were well-developed and the plot kept me engaged throughout.",
  "I found this book to be thought-provoking and beautifully written. It's definitely one of my favorites now.",
  "While I enjoyed the writing style, I felt the pacing was a bit slow in the middle. Still worth reading though.",
  "An incredible read! The author's unique perspective really shines through in this work.",
  "I had mixed feelings about this one. Some parts were fantastic, others didn't quite land for me.",
  "This book exceeded all my expectations. I couldn't put it down and finished it in one sitting.",
  "The themes explored in this book are very relevant today. It sparked great discussions in our club.",
  "I appreciated the author's attention to detail and world-building. A truly immersive experience.",
  "Not my usual genre, but I'm glad I gave it a chance. The ending was particularly satisfying.",
  "A compelling narrative with complex characters. I'd recommend this to anyone looking for a good read.",
];

function generateReview(): string {
  return randomElement(reviewTemplates);
}

// Load config file
const configFile = process.argv[2];
if (!configFile) {
  console.error("Usage: ts-node seedClubs.ts <config-file>");
  console.error("Example: ts-node seedClubs.ts seed-clubs.yaml");
  process.exit(1);
}

let config: Config;
try {
  const fileContents = fs.readFileSync(configFile, "utf8");
  config = yaml.load(fileContents) as Config;
} catch (error) {
  console.error("Error loading config file:", error);
  process.exit(1);
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert("../firebase_sa_key.json"),
  databaseURL: "https://sombk-firebase-free-default-rtdb.firebaseio.com",
});

const db = admin.database();

async function seedClubs() {
  console.log(`🌱 Seeding ${config.clubs.length} clubs...\n`);

  for (let i = 0; i < config.clubs.length; i++) {
    const clubSeed = config.clubs[i];
    console.log(`📚 Creating club: ${clubSeed.name} (${clubSeed.personality})`);

    // Create a new club reference
    const clubsRef = db.ref("clubs");
    const newClubRef = clubsRef.push();
    const clubId = newClubRef.key;

    if (!clubId) {
      console.error(`❌ Failed to generate club ID for ${clubSeed.name}`);
      continue;
    }

    // Prepare member bookData
    const memberBookDataMap: Record<string, Array<{ title: string; read: boolean; halfCredit?: boolean }>> = {};
    for (const member of clubSeed.members) {
      memberBookDataMap[member.id] = [];
      for (const book of clubSeed.booksRead) {
        const hasRead = book.readBy.includes(member.id);
        memberBookDataMap[member.id].push({
          title: book.title,
          read: hasRead,
          halfCredit: hasRead && Math.random() < 0.1, // 10% chance of half credit
        });
      }
    }

    // Add bookData to members
    const membersWithBookData = clubSeed.members.map((member) => ({
      ...member,
      bookData: memberBookDataMap[member.id] || [],
    }));

    // Create club data
    const clubData: any = {
      name: clubSeed.name,
      description: clubSeed.description,
      coverColor: clubSeed.coverColor,
      isPublic: true, // All clubs are public
      memberCount: clubSeed.memberCount,
      members: membersWithBookData,
      booksRead: clubSeed.booksRead,
      recentActivity: [],
    };

    if (clubSeed.coverImage) {
      clubData.coverImage = clubSeed.coverImage;
    }

    if (clubSeed.currentBook) {
      clubData.currentBook = clubSeed.currentBook;
    }

    if (clubSeed.onDeckBook) {
      clubData.onDeckBook = clubSeed.onDeckBook;
    }

    // Create the club
    await newClubRef.set(clubData);

    console.log(`  ✅ Created club with ID: ${clubId}`);
    console.log(`  👥 Members: ${clubSeed.memberCount}`);
    console.log(`  📖 Books read: ${clubSeed.booksRead.length}`);
    console.log(`  📊 Current book: ${clubSeed.currentBook?.title || "None"}`);
    console.log(`  📋 On deck: ${clubSeed.onDeckBook?.title || "None"}`);
    
    // Count ratings and reviews
    let totalRatings = 0;
    let totalReviews = 0;
    for (const book of clubSeed.booksRead) {
      if (book.ratings) {
        totalRatings += Object.keys(book.ratings).length;
      }
      if (book.reviews) {
        totalReviews += Object.keys(book.reviews).length;
      }
    }
    console.log(`  ⭐ Ratings: ${totalRatings}, 💬 Reviews: ${totalReviews}`);
    console.log();
  }

  console.log(`\n✅ Successfully seeded ${config.clubs.length} clubs!`);
  console.log(`\n📝 Note: These clubs use generated user IDs (seed_user_*).`);
  console.log(`   To link them to real users, you'll need to update the member IDs.`);

  // Close Firebase connection
  await admin.app().delete();
  process.exit(0);
}

seedClubs().catch((error) => {
  console.error("❌ Error seeding clubs:", error);
  process.exit(1);
});

