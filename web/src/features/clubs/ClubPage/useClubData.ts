import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Database, ref, onValue } from 'firebase/database';
import { User } from 'firebase/auth';
import { Club } from '../../../types';

interface UseClubDataProps {
  db: Database;
  user: User | null;
}

export const useClubData = ({ db, user }: UseClubDataProps) => {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clubId) {
      navigate('/clubs');
      return;
    }

    if (!db || !user) {
      setLoading(false);
      return;
    }

    // Load club data from Firebase
    const clubRef = ref(db, `clubs/${clubId}`);
    const unsubscribe = onValue(clubRef, (snapshot) => {
      const clubData = snapshot.val();
      if (clubData) {
        // Check if user is actually a member of this club
        const isMember = clubData.members && 
          Object.values(clubData.members).some((member: any) => member.id === user.uid);
        
        if (isMember) {
          setClub({
            id: clubId,
            ...clubData
          });
        } else {
          // User is not a member, redirect to clubs page
          setClub(null);
          navigate('/clubs');
        }
      } else {
        setClub(null);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error loading club data:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [clubId, db, user, navigate]);

  return { club, loading };
};