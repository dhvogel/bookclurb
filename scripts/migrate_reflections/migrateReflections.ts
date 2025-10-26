import * as admin from "firebase-admin";

// --- Initialize Firebase Admin ---
admin.initializeApp({
  credential: admin.credential.cert("../../firebase_sa_key.json"),
  databaseURL: "https://sombk-firebase-free-default-rtdb.firebaseio.com"
});

const db = admin.database();

async function migrateReflectionsToClubStructure() {
  console.log(`🔄 Migrating reflections from old structure to club-based structure...`);
  
  try {
    // Step 1: Get all reflections from the old structure
    console.log(`📖 Fetching reflections from old structure...`);
    const reflectionsRef = db.ref("reflections");
    const reflectionsSnapshot = await reflectionsRef.once("value");
    const allReflections = reflectionsSnapshot.val();
    
    if (!allReflections) {
      console.log(`ℹ️ No reflections found in old structure. Nothing to migrate.`);
      await admin.app().delete();
      process.exit(0);
    }
    
    // Step 2: Get all users to map user IDs to names
    console.log(`👥 Fetching user data for name mapping...`);
    const usersRef = db.ref("users");
    const usersSnapshot = await usersRef.once("value");
    const allUsers = usersSnapshot.val() || {};
    
    // Step 3: Get club data to add meetings structure
    console.log(`🏛️ Fetching club data...`);
    const clubsRef = db.ref("clubs");
    const clubsSnapshot = await clubsRef.once("value");
    const allClubs = clubsSnapshot.val() || {};
    
    // Step 4: Define meetings structure (matching DiscussionsTab)
    const meetingsStructure = [
      {
        id: "meeting-2025-10-30",
        time: "Thu, 10/30, 6:00 PM EDT",
        reading: "Empire of Pain, Ch 26-End",
        date: "2025-10-30",
        status: 'current'
      },
      {
        id: "meeting-2025-10-23",
        time: "Thu, 10/23, 6:00 PM EDT",
        reading: "Empire of Pain, Ch 21-25",
        date: "2025-10-23",
        status: 'past'
      },
      {
        id: "meeting-2025-10-16",
        time: "Thu, 10/16, 6:00 PM EDT",
        reading: "Empire of Pain, Ch 15-20",
        date: "2025-10-16",
        status: 'past'
      },
      {
        id: "meeting-2025-10-09",
        time: "Thu, 10/9, 6:00 PM EDT",
        reading: "Empire of Pain, Ch 11-14",
        date: "2025-10-09",
        status: 'past'
      },
      {
        id: "meeting-2025-10-02",
        time: "Thu, 10/2, 6:00 PM EDT",
        reading: "Empire of Pain, Ch 8-10",
        date: "2025-10-02",
        status: 'past'
      },
      {
        id: "meeting-2025-09-25",
        time: "Thu, 9/25, 6:00 PM EDT",
        reading: "Empire of Pain, Ch 4-7",
        date: "2025-09-25",
        status: 'past'
      },
      {
        id: "meeting-2025-09-18",
        time: "Thu, 9/18, 6:00 PM EDT",
        reading: "Empire of Pain, Ch 1-3",
        date: "2025-09-18",
        status: 'past'
      },
    ];
    
    // Step 5: Process each club
    let clubsUpdated = 0;
    let reflectionsMigrated = 0;
    
    for (const [clubId, clubData] of Object.entries(allClubs)) {
      console.log(`\n🏛️ Processing club: ${clubId}`);
      
      // Create meetings structure for this club
      const meetingsWithReflections = meetingsStructure.map(meeting => {
        const reflections: Array<{
          userId: string;
          userName: string;
          reflection: string;
          timestamp: number;
        }> = [];
        
        // Find reflections for this meeting
        for (const [userId, userReflections] of Object.entries(allReflections)) {
          if (userReflections && typeof userReflections === 'object') {
            const meetingReflection = (userReflections as any)[meeting.id];
            if (meetingReflection && meetingReflection.reflection) {
              // Get user name
              const userData = allUsers[userId];
              const userName = userData 
                ? `${userData.first_name || ""} ${userData.last_name || ""}`.trim() || userId
                : userId;
              
              reflections.push({
                userId,
                userName,
                reflection: meetingReflection.reflection,
                timestamp: meetingReflection.timestamp || Date.now()
              });
              
              reflectionsMigrated++;
            }
          }
        }
        
        return {
          ...meeting,
          reflections: reflections.length > 0 ? reflections : undefined
        };
      });
      
      // Update club with meetings structure
      const clubRef = db.ref(`clubs/${clubId}`);
      await clubRef.update({
        meetings: meetingsWithReflections
      });
      
      console.log(`✅ Updated club ${clubId} with ${meetingsWithReflections.filter(m => m.reflections).length} meetings containing reflections`);
      clubsUpdated++;
    }
    
    // Step 6: Clean up old reflections structure (optional - commented out for safety)
    // console.log(`\n🗑️ Cleaning up old reflections structure...`);
    // await reflectionsRef.remove();
    // console.log(`✅ Removed old reflections structure`);
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`- Clubs updated: ${clubsUpdated}`);
    console.log(`- Reflections migrated: ${reflectionsMigrated}`);
    console.log(`- Meetings structure added to all clubs`);
    console.log(`\n⚠️ Note: Old reflections structure preserved for safety. You can remove it manually after testing.`);
    
  } catch (error) {
    console.error(`❌ Migration failed:`, error);
  }
  
  // Close the Firebase connection
  await admin.app().delete();
  process.exit(0);
}

migrateReflectionsToClubStructure().catch(console.error);
