import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Club } from '../../../types';

export const useClubData = () => {
  const { clubId } = useParams<{ clubId: string }>();
  const navigate = useNavigate();
  const [club, setClub] = useState<Club | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clubId) {
      navigate('/clubs');
      return;
    }

    // For now, use mock data - replace with Firebase integration later
    if (clubId === 'bookclubid1') {
      setClub({
        id: 'bookclubid1',
        name: 'SOM Book Club',
        coverColor: '#00356b',
        description: 'A vibrant community of readers exploring diverse literature and engaging in thoughtful discussions.',
        nextMeeting: { 
          timestamp: '2025-10-30T22:00:00Z',
          timeZone: 'America/New_York',
          location: 'WhatsApp' 
        },
        currentBook: { 
          title: 'Empire of Pain', 
          author: 'Patrick Radden Keefe',
          isbn: '9780385545686',
          coverUrl: 'https://covers.openlibrary.org/b/isbn/9780385545686-L.jpg'
        },
        memberCount: 8,
        members: [
          { id: '1', name: 'Dan', role: 'admin' },
          { id: '2', name: 'Grant', role: 'member' },
          { id: '3', name: 'Dhru', role: 'member' },
          { id: '4', name: 'Margaret', role: 'member' },
          { id: '5', name: 'David', role: 'member' },
          { id: '6', name: 'Alden', role: 'member' },
          { id: '7', name: 'Paul', role: 'member' },
          { id: '8', name: 'Charles', role: 'member' },
          { id: '9', name: 'Sam', role: 'member' },
          { id: '10', name: 'Evan', role: 'member' },
        ],
        recentActivity: [
          {
            id: '1',
            type: 'discussion',
            title: 'Thoughts on Chapter 3',
            author: 'Dan',
            timestamp: '2 hours ago',
            content: 'Boo Sacklers, boo!'
          },
        ]
      });
    }
    setLoading(false);
  }, [clubId, navigate]);

  return { club, loading };
};
