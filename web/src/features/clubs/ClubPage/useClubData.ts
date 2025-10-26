import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Database, ref, onValue } from 'firebase/database';
import { Club } from '../../../types';

interface UseClubDataProps {
  db: Database;
}

export const useClubData = ({ db }: UseClubDataProps) => {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clubId) {
      navigate('/clubs');
      return;
    }

    if (!db) {
      setLoading(false);
      return;
    }

    // Load club data from Firebase
    const clubRef = ref(db, `clubs/${clubId}`);
    const unsubscribe = onValue(clubRef, (snapshot) => {
      const clubData = snapshot.val();
      if (clubData) {
        setClub({
          id: clubId,
          ...clubData
        });
      } else {
        setClub(null);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error loading club data:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [clubId, db, navigate]);

  return { club, loading };
};