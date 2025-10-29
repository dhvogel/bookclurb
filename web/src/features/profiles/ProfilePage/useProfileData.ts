import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { Database } from 'firebase/database';
import { User } from 'firebase/auth';
import { Club } from '../../../types';

export const useProfileData = ({ user, db }: { user: User | null; db: Database }) => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubsLoading, setClubsLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) {
      setClubsLoading(false);
      return;
    }

    const userRef = ref(db, `users/${user.uid}`);
    const unsubscribe = onValue(userRef, async (snapshot) => {
      const userData = snapshot.val();
      if (userData && userData.clubs) {
        // Fetch club details for each club ID and verify membership
        const clubPromises = userData.clubs.map(async (clubId: string) => {
          const clubRef = ref(db, `clubs/${clubId}`);
          return new Promise<Club | null>((resolve) => {
            const unsubscribe = onValue(clubRef, (clubSnapshot) => {
              const clubData = clubSnapshot.val();
              if (clubData) {
                // Check if user is actually a member of this club
                const isMember = clubData.members && 
                  Object.values(clubData.members).some((member: any) => member.id === user.uid);
                
                if (isMember) {
                  // Calculate member count from members object
                  const membersCount = clubData.members 
                    ? (Array.isArray(clubData.members) ? clubData.members.length : Object.keys(clubData.members).length)
                    : 0;
                  
                  resolve({
                    id: clubId,
                    name: clubData.name || 'Untitled Club',
                    coverImage: clubData.coverImage,
                    coverColor: clubData.coverColor || '#667eea',
                    nextMeeting: clubData.nextMeeting,
                    currentBook: clubData.currentBook,
                    memberCount: clubData.memberCount || membersCount,
                    description: clubData.description,
                    booksRead: clubData.booksRead,
                    members: clubData.members,
                    recentActivity: clubData.recentActivity,
                  });
                } else {
                  resolve(null);
                }
              } else {
                resolve(null);
              }
              unsubscribe();
            });
          });
        });

        Promise.all(clubPromises).then((clubList) => {
          const validClubs = clubList.filter((club): club is Club => club !== null);
          setClubs(validClubs);
          setClubsLoading(false);
        });
      } else {
        setClubs([]);
        setClubsLoading(false);
      }
    }, (error) => {
      console.error('Error loading user clubs:', error);
      setClubs([]);
      setClubsLoading(false);
    });

    return () => unsubscribe();
  }, [user, db]);

  return { clubs, clubsLoading };
};

