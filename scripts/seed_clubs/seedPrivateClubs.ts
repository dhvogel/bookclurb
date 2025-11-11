const admin = require("firebase-admin");

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
  readBy: string[]; // Array of member IDs who read this book
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

// Helper function to generate a random number between min and max
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to pick a random element from an array
function randomElement<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)];
}

// Helper function to pick multiple random elements from an array
function randomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Generate a fake user ID
function generateUserId(index: number): string {
  return `seed_user_${index}_${Math.random().toString(36).substring(2, 15)}`;
}

// Generate cover URL from ISBN
function getCoverUrl(isbn: string): string {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
}

// Sample books with ISBNs
const sampleBooks = [
  { title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "9780743273565" },
  { title: "To Kill a Mockingbird", author: "Harper Lee", isbn: "9780061120084" },
  { title: "1984", author: "George Orwell", isbn: "9780451524935" },
  { title: "Pride and Prejudice", author: "Jane Austen", isbn: "9780141439518" },
  { title: "The Catcher in the Rye", author: "J.D. Salinger", isbn: "9780316769174" },
  { title: "Lord of the Flies", author: "William Golding", isbn: "9780571056866" },
  { title: "Brave New World", author: "Aldous Huxley", isbn: "9780060850524" },
  { title: "The Hobbit", author: "J.R.R. Tolkien", isbn: "9780547928227" },
  { title: "Fahrenheit 451", author: "Ray Bradbury", isbn: "9781451673319" },
  { title: "Jane Eyre", author: "Charlotte Brontë", isbn: "9780141441146" },
  { title: "Animal Farm", author: "George Orwell", isbn: "9780452284241" },
  { title: "The Picture of Dorian Gray", author: "Oscar Wilde", isbn: "9780141442464" },
  { title: "Wuthering Heights", author: "Emily Brontë", isbn: "9780141439556" },
  { title: "Frankenstein", author: "Mary Shelley", isbn: "9780141439471" },
  { title: "Dracula", author: "Bram Stoker", isbn: "9780141439846" },
  { title: "The Adventures of Huckleberry Finn", author: "Mark Twain", isbn: "9780142437179" },
  { title: "Moby Dick", author: "Herman Melville", isbn: "9780142437247" },
  { title: "The Count of Monte Cristo", author: "Alexandre Dumas", isbn: "9780140449266" },
  { title: "Les Misérables", author: "Victor Hugo", isbn: "9780451419439" },
  { title: "Crime and Punishment", author: "Fyodor Dostoevsky", isbn: "9780140449136" },
  { title: "The Brothers Karamazov", author: "Fyodor Dostoevsky", isbn: "9780140449242" },
  { title: "War and Peace", author: "Leo Tolstoy", isbn: "9780143039990" },
  { title: "Anna Karenina", author: "Leo Tolstoy", isbn: "9780143035008" },
  { title: "The Handmaid's Tale", author: "Margaret Atwood", isbn: "9780385490818" },
  { title: "Beloved", author: "Toni Morrison", isbn: "9781400033416" },
  { title: "The Kite Runner", author: "Khaled Hosseini", isbn: "9781594631931" },
  { title: "The Book Thief", author: "Markus Zusak", isbn: "9780375842207" },
  { title: "Life of Pi", author: "Yann Martel", isbn: "9780156027328" },
  { title: "The Alchemist", author: "Paulo Coelho", isbn: "9780061122415" },
  { title: "The Night Circus", author: "Erin Morgenstern", isbn: "9780307744432" },
];

// First names for generating members
const firstNames = [
  "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn",
  "Emma", "Noah", "Olivia", "Liam", "Sophia", "Mason", "Isabella", "Ethan",
  "Mia", "James", "Charlotte", "Benjamin", "Amelia", "Lucas", "Harper", "Henry",
  "Evelyn", "Alexander", "Abigail", "Michael", "Emily", "Daniel", "Elizabeth", "Matthew",
  "Sofia", "David", "Avery", "Joseph", "Ella", "Jackson", "Madison", "Samuel",
  "Scarlett", "Sebastian", "Victoria", "Aiden", "Aria", "Owen", "Grace", "Wyatt"
];

// Last names for generating members
const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Wilson", "Anderson", "Thomas", "Taylor",
  "Moore", "Jackson", "Martin", "Lee", "Thompson", "White", "Harris", "Clark",
  "Lewis", "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott",
  "Torres", "Nguyen", "Hill", "Flores", "Green", "Adams", "Nelson", "Baker"
];

// Review templates
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
  "The writing was beautiful, though some sections dragged a bit. Overall, a solid read.",
  "This book completely changed my perspective. It's a must-read for anyone interested in this topic.",
  "I loved the character development and the way the story unfolded. Couldn't wait to discuss it with the group.",
  "The book had some great moments, but I felt it could have been more concise.",
  "Absolutely brilliant! One of the best books I've read this year.",
];

function generateReview(): string {
  return randomElement(reviewTemplates);
}

// Generate a date string in the past
function generatePastDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

// Generate a date string in the future
function generateFutureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

// Generate member names
function generateMembers(count: number, startIndex: number): Member[] {
  const members: Member[] = [];
  const usedNames = new Set<string>();
  
  for (let i = 0; i < count; i++) {
    let fullName: string;
    do {
      const firstName = randomElement(firstNames);
      const lastName = randomElement(lastNames);
      fullName = `${firstName} ${lastName}`;
    } while (usedNames.has(fullName));
    
    usedNames.add(fullName);
    
    const userId = generateUserId(startIndex + i);
    const joinedAt = generatePastDate(randomInt(90, 365));
    
    members.push({
      id: userId,
      name: fullName,
      role: i === 0 ? "admin" : "member", // First member is admin
      joinedAt: joinedAt,
      img: `https://api.dicebear.com/7.x/bottts/png?seed=${fullName}&backgroundColor=ffffff`,
    });
  }
  
  return members;
}

// Generate books read for a club
function generateBooksRead(
  members: Member[],
  bookCount: number,
  personality: string
): BookRead[] {
  const books: BookRead[] = [];
  const selectedBooks = randomElements(sampleBooks, bookCount);
  
  selectedBooks.forEach((book, index) => {
    // Determine how many members read this book (60-90% of members)
    const readPercentage = randomInt(60, 90) / 100;
    const readerCount = Math.max(1, Math.floor(members.length * readPercentage));
    const readers = randomElements(members, readerCount);
    
    // Generate ratings and reviews for some readers
    const ratings: Record<string, number> = {};
    const reviews: Record<string, string> = {};
    
    // 70-90% of readers rate the book
    const ratingCount = Math.floor(readers.length * randomInt(70, 90) / 100);
    const ratingReaders = randomElements(readers, ratingCount);
    
    ratingReaders.forEach(reader => {
      // Generate ratings based on personality
      let rating: number;
      if (personality === "academic") {
        // Academic clubs tend to be more critical
        rating = randomInt(3, 5);
      } else if (personality === "casual") {
        // Casual clubs are more positive
        rating = randomInt(4, 5);
      } else if (personality === "diverse") {
        // Diverse opinions
        rating = randomInt(2, 5);
      } else {
        // Mixed
        rating = randomInt(3, 5);
      }
      
      ratings[reader.id] = rating;
      
      // 50% chance of writing a review
      if (Math.random() < 0.5) {
        reviews[reader.id] = generateReview();
      }
    });
    
    const completedAt = generatePastDate(randomInt(5, 180));
    
    books.push({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      coverUrl: getCoverUrl(book.isbn),
      readBy: readers.map(r => r.id),
      completedAt: completedAt,
      ratings: Object.keys(ratings).length > 0 ? ratings : undefined,
      reviews: Object.keys(reviews).length > 0 ? reviews : undefined,
    });
  });
  
  return books;
}

// Helper function to remove undefined properties from an object
function removeUndefined(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        cleaned[key] = removeUndefined(obj[key]);
      }
    }
    return cleaned;
  }
  return obj;
}

// Generate reading schedule
function generateSchedule(totalPages: number, startDate: string): Array<{ date: string; pages: number }> {
  const schedule: Array<{ date: string; pages: number }> = [];
  const start = new Date(startDate);
  let currentPage = 0;
  let currentDate = new Date(start);
  
  // Weekly meetings for 8-12 weeks
  const weeks = randomInt(8, 12);
  
  for (let i = 0; i < weeks; i++) {
    const pagesPerWeek = Math.floor(totalPages / weeks);
    const pages = i === weeks - 1 ? totalPages - currentPage : pagesPerWeek;
    currentPage += pages;
    
    schedule.push({
      date: currentDate.toISOString().split('T')[0],
      pages: currentPage,
    });
    
    // Move to next week
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  return schedule;
}

// Generate private club seeds
function generatePrivateClubSeeds(): ClubSeed[] {
  const clubs: ClubSeed[] = [];
  let memberIndexCounter = 0;
  
  // Club 1: Family Book Club (4 members - small, intimate)
  const familyMembers = generateMembers(4, memberIndexCounter);
  memberIndexCounter += 4;
  const familyBooks = generateBooksRead(familyMembers, 5, "casual");
  const familyCurrentBook = randomElement(sampleBooks.filter(b => !familyBooks.find(fb => fb.title === b.title)));
  const familyOnDeck = randomElement(sampleBooks.filter(b => 
    b.title !== familyCurrentBook.title && 
    !familyBooks.find(fb => fb.title === b.title)
  ));
  
  clubs.push({
    name: "The Johnson Family Book Club",
    description: "A private book club for our family members. We read together and share our thoughts in a comfortable, familiar setting.",
    coverColor: "#e67e22",
    personality: "casual",
    memberCount: 4,
    members: familyMembers,
    booksRead: familyBooks,
    currentBook: {
      title: familyCurrentBook.title,
      author: familyCurrentBook.author,
      isbn: familyCurrentBook.isbn,
      coverUrl: getCoverUrl(familyCurrentBook.isbn),
      pageCount: randomInt(250, 400),
      progress: {
        percentage: randomInt(40, 75),
        currentPages: randomInt(100, 300),
        totalPages: randomInt(250, 400),
      },
      schedule: generateSchedule(randomInt(250, 400), generateFutureDate(-20)),
    },
    onDeckBook: {
      title: familyOnDeck.title,
      author: familyOnDeck.author,
      isbn: familyOnDeck.isbn,
      coverUrl: getCoverUrl(familyOnDeck.isbn),
    },
  });
  
  // Club 2: Work Colleagues Book Club (6 members)
  const workMembers = generateMembers(6, memberIndexCounter);
  memberIndexCounter += 6;
  const workBooks = generateBooksRead(workMembers, 4, "mixed");
  const workCurrentBook = randomElement(sampleBooks.filter(b => !workBooks.find(wb => wb.title === b.title)));
  const workOnDeck = randomElement(sampleBooks.filter(b => 
    b.title !== workCurrentBook.title && 
    !workBooks.find(wb => wb.title === b.title)
  ));
  
  clubs.push({
    name: "Acme Corp Book Club",
    description: "A private book club for our team members. We meet monthly to discuss books and build stronger connections outside of work.",
    coverColor: "#3498db",
    personality: "mixed",
    memberCount: 6,
    members: workMembers,
    booksRead: workBooks,
    currentBook: {
      title: workCurrentBook.title,
      author: workCurrentBook.author,
      isbn: workCurrentBook.isbn,
      coverUrl: getCoverUrl(workCurrentBook.isbn),
      pageCount: randomInt(300, 500),
      progress: {
        percentage: randomInt(30, 60),
        currentPages: randomInt(90, 300),
        totalPages: randomInt(300, 500),
      },
      schedule: generateSchedule(randomInt(300, 500), generateFutureDate(-25)),
    },
    onDeckBook: {
      title: workOnDeck.title,
      author: workOnDeck.author,
      isbn: workOnDeck.isbn,
      coverUrl: getCoverUrl(workOnDeck.isbn),
    },
  });
  
  // Club 3: Close Friends Book Club (5 members)
  const friendsMembers = generateMembers(5, memberIndexCounter);
  memberIndexCounter += 5;
  const friendsBooks = generateBooksRead(friendsMembers, 6, "casual");
  const friendsCurrentBook = randomElement(sampleBooks.filter(b => !friendsBooks.find(fb => fb.title === b.title)));
  const friendsOnDeck = randomElement(sampleBooks.filter(b => 
    b.title !== friendsCurrentBook.title && 
    !friendsBooks.find(fb => fb.title === b.title)
  ));
  
  clubs.push({
    name: "The Bookworms",
    description: "A private book club for our close circle of friends. We've been reading together for years and love our monthly discussions.",
    coverColor: "#9b59b6",
    personality: "casual",
    memberCount: 5,
    members: friendsMembers,
    booksRead: friendsBooks,
    currentBook: {
      title: friendsCurrentBook.title,
      author: friendsCurrentBook.author,
      isbn: friendsCurrentBook.isbn,
      coverUrl: getCoverUrl(friendsCurrentBook.isbn),
      pageCount: randomInt(280, 450),
      progress: {
        percentage: randomInt(45, 80),
        currentPages: randomInt(126, 360),
        totalPages: randomInt(280, 450),
      },
      schedule: generateSchedule(randomInt(280, 450), generateFutureDate(-15)),
    },
    onDeckBook: {
      title: friendsOnDeck.title,
      author: friendsOnDeck.author,
      isbn: friendsOnDeck.isbn,
      coverUrl: getCoverUrl(friendsOnDeck.isbn),
    },
  });
  
  // Club 4: Neighborhood Book Club (8 members)
  const neighborhoodMembers = generateMembers(8, memberIndexCounter);
  memberIndexCounter += 8;
  const neighborhoodBooks = generateBooksRead(neighborhoodMembers, 7, "mixed");
  const neighborhoodCurrentBook = randomElement(sampleBooks.filter(b => !neighborhoodBooks.find(nb => nb.title === b.title)));
  const neighborhoodOnDeck = randomElement(sampleBooks.filter(b => 
    b.title !== neighborhoodCurrentBook.title && 
    !neighborhoodBooks.find(nb => nb.title === b.title)
  ));
  
  clubs.push({
    name: "Maple Street Readers",
    description: "A private book club for our neighborhood. We meet at each other's homes and enjoy good books and great company.",
    coverColor: "#27ae60",
    personality: "mixed",
    memberCount: 8,
    members: neighborhoodMembers,
    booksRead: neighborhoodBooks,
    currentBook: {
      title: neighborhoodCurrentBook.title,
      author: neighborhoodCurrentBook.author,
      isbn: neighborhoodCurrentBook.isbn,
      coverUrl: getCoverUrl(neighborhoodCurrentBook.isbn),
      pageCount: randomInt(320, 550),
      progress: {
        percentage: randomInt(35, 70),
        currentPages: randomInt(112, 385),
        totalPages: randomInt(320, 550),
      },
      schedule: generateSchedule(randomInt(320, 550), generateFutureDate(-28)),
    },
    onDeckBook: {
      title: neighborhoodOnDeck.title,
      author: neighborhoodOnDeck.author,
      isbn: neighborhoodOnDeck.isbn,
      coverUrl: getCoverUrl(neighborhoodOnDeck.isbn),
    },
  });
  
  // Club 5: College Alumni Book Club (7 members)
  const alumniMembers = generateMembers(7, memberIndexCounter);
  memberIndexCounter += 7;
  const alumniBooks = generateBooksRead(alumniMembers, 8, "academic");
  const alumniCurrentBook = randomElement(sampleBooks.filter(b => !alumniBooks.find(ab => ab.title === b.title)));
  const alumniOnDeck = randomElement(sampleBooks.filter(b => 
    b.title !== alumniCurrentBook.title && 
    !alumniBooks.find(ab => ab.title === b.title)
  ));
  
  clubs.push({
    name: "Class of 2015 Book Club",
    description: "A private book club for our college alumni group. We stay connected through literature and meaningful discussions.",
    coverColor: "#2c3e50",
    personality: "academic",
    memberCount: 7,
    members: alumniMembers,
    booksRead: alumniBooks,
    currentBook: {
      title: alumniCurrentBook.title,
      author: alumniCurrentBook.author,
      isbn: alumniCurrentBook.isbn,
      coverUrl: getCoverUrl(alumniCurrentBook.isbn),
      pageCount: randomInt(300, 600),
      progress: {
        percentage: randomInt(25, 65),
        currentPages: randomInt(75, 390),
        totalPages: randomInt(300, 600),
      },
      schedule: generateSchedule(randomInt(300, 600), generateFutureDate(-30)),
    },
    onDeckBook: {
      title: alumniOnDeck.title,
      author: alumniOnDeck.author,
      isbn: alumniOnDeck.isbn,
      coverUrl: getCoverUrl(alumniOnDeck.isbn),
    },
  });
  
  // Club 6: Small Study Group (3 members - very small, intimate)
  const studyMembers = generateMembers(3, memberIndexCounter);
  memberIndexCounter += 3;
  const studyBooks = generateBooksRead(studyMembers, 3, "academic");
  const studyCurrentBook = randomElement(sampleBooks.filter(b => !studyBooks.find(sb => sb.title === b.title)));
  const studyOnDeck = randomElement(sampleBooks.filter(b => 
    b.title !== studyCurrentBook.title && 
    !studyBooks.find(sb => sb.title === b.title)
  ));
  
  clubs.push({
    name: "Literary Analysis Group",
    description: "A small, private study group focused on deep literary analysis and academic discussion. By invitation only.",
    coverColor: "#34495e",
    personality: "academic",
    memberCount: 3,
    members: studyMembers,
    booksRead: studyBooks,
    currentBook: {
      title: studyCurrentBook.title,
      author: studyCurrentBook.author,
      isbn: studyCurrentBook.isbn,
      coverUrl: getCoverUrl(studyCurrentBook.isbn),
      pageCount: randomInt(400, 700),
      progress: {
        percentage: randomInt(20, 50),
        currentPages: randomInt(80, 350),
        totalPages: randomInt(400, 700),
      },
      schedule: generateSchedule(randomInt(400, 700), generateFutureDate(-35)),
    },
    onDeckBook: {
      title: studyOnDeck.title,
      author: studyOnDeck.author,
      isbn: studyOnDeck.isbn,
      coverUrl: getCoverUrl(studyOnDeck.isbn),
    },
  });
  
  return clubs;
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert("../firebase_sa_key.json"),
  databaseURL: "https://sombk-firebase-free-default-rtdb.firebaseio.com",
});

const db = admin.database();

async function seedPrivateClubs() {
  const clubSeeds = generatePrivateClubSeeds();
  console.log(`🌱 Seeding ${clubSeeds.length} private clubs...\n`);

  for (let i = 0; i < clubSeeds.length; i++) {
    const clubSeed = clubSeeds[i];
    console.log(`📚 Creating private club: ${clubSeed.name} (${clubSeed.personality})`);

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

    // Create club data - IMPORTANT: isPublic is set to false for private clubs
    const clubData: any = {
      name: clubSeed.name,
      description: clubSeed.description,
      coverColor: clubSeed.coverColor,
      isPublic: false, // Private clubs are not public
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

    // Clean the entire clubData object to remove any undefined properties
    const cleanedClubData = removeUndefined(clubData);

    // Create the club
    await newClubRef.set(cleanedClubData);

    console.log(`  ✅ Created private club with ID: ${clubId}`);
    console.log(`  🔒 Privacy: Private (not visible on public clubs page)`);
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
    
    // Show progress info
    if (clubSeed.currentBook?.progress) {
      console.log(`  📈 Progress: ${clubSeed.currentBook.progress.percentage}% (${clubSeed.currentBook.progress.currentPages}/${clubSeed.currentBook.progress.totalPages} pages)`);
    }
    console.log();
  }

  console.log(`\n✅ Successfully seeded ${clubSeeds.length} private clubs!`);
  console.log(`\n📝 Note: These clubs use generated user IDs (seed_user_*).`);
  console.log(`   To link them to real users, you'll need to update the member IDs.`);
  console.log(`\n🔒 All clubs are PRIVATE and have:`);
  console.log(`   - isPublic: false (not visible on public clubs page)`);
  console.log(`   - Varying member counts (3-8)`);
  console.log(`   - Different personalities`);
  console.log(`   - Ratings and reviews`);
  console.log(`   - Current books with reading progress`);
  console.log(`   - On deck books`);

  // Close Firebase connection
  await admin.app().delete();
  process.exit(0);
}

seedPrivateClubs().catch((error) => {
  console.error("❌ Error seeding private clubs:", error);
  process.exit(1);
});

