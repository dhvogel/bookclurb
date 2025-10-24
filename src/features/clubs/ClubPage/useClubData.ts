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
        memberCount: 10,
        members: [
          { id: '1', name: 'Dan', role: 'admin', img: 'https://api.dicebear.com/7.x/bottts/png?seed=Dan&backgroundColor=f8f9fa' },
          { id: '2', name: 'Grant', role: 'member', img: 'https://api.dicebear.com/7.x/bottts/png?seed=Grant&backgroundColor=f8f9fa' },
          { id: '3', name: 'Dhru', role: 'member', img: 'https://api.dicebear.com/7.x/bottts/png?seed=Dhru&backgroundColor=f8f9fa' },
          { id: '4', name: 'Margaret', role: 'member', img: 'https://api.dicebear.com/7.x/bottts/png?seed=Margaret&backgroundColor=f8f9fa' },
          { id: '5', name: 'David', role: 'member', img: 'https://api.dicebear.com/7.x/bottts/png?seed=David&backgroundColor=f8f9fa' },
          { id: '6', name: 'Alden', role: 'member', img: 'https://api.dicebear.com/7.x/bottts/png?seed=Alden&backgroundColor=f8f9fa' },
          { id: '7', name: 'Paul', role: 'member', img: 'https://api.dicebear.com/7.x/bottts/png?seed=Paul&backgroundColor=f8f9fa' },
          { id: '8', name: 'Charles', role: 'member', img: 'https://api.dicebear.com/7.x/bottts/png?seed=Charles&backgroundColor=f8f9fa' },
          { id: '9', name: 'Sam', role: 'member', img: 'https://api.dicebear.com/7.x/bottts/png?seed=Sam&backgroundColor=f8f9fa' },
          { id: '10', name: 'Evan', role: 'member', img: 'https://api.dicebear.com/7.x/bottts/png?seed=Evan&backgroundColor=f8f9fa' },
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
