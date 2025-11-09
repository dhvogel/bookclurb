import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, ref, onValue, update, get } from 'firebase/database';
import HeaderBar from './HeaderBar';
import { motion, AnimatePresence } from 'framer-motion';
import { ClubsProps, Club } from '../types';
import { extractClubBooksRead } from '../utils/bookUtils';
import CreateClubModal from './CreateClubModal';

// Helper function to calculate average rating for a book
const calculateAverageRating = (ratings?: Record<string, number>): number => {
  if (!ratings || Object.keys(ratings).length === 0) {
    return 0;
  }
  const ratingValues = Object.values(ratings);
  const sum = ratingValues.reduce((acc, val) => acc + val, 0);
  return sum / ratingValues.length;
};

// Helper function to get highest and lowest rated books
const getRatedBooks = (club: Club) => {
  if (!club.booksRead || club.booksRead.length === 0) {
    return { highest: null, lowest: null };
  }

  const ratedBooks = club.booksRead
    .filter(book => book.ratings && Object.keys(book.ratings).length > 0)
    .map(book => ({
      ...book,
      averageRating: calculateAverageRating(book.ratings)
    }));

  if (ratedBooks.length === 0) {
    return { highest: null, lowest: null };
  }

  const highest = ratedBooks.reduce((max, book) => 
    book.averageRating > max.averageRating ? book : max
  );
  
  const lowest = ratedBooks.reduce((min, book) => 
    book.averageRating < min.averageRating ? book : min
  );

  return { highest, lowest };
};

// Helper function to get the next upcoming meeting from reading schedule (same source as Reading Schedule display)
const getNextMeeting = (club: Club) => {
  if (!club.currentBook?.schedule || club.currentBook.schedule.length === 0) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find upcoming schedule entries (same logic as ReadingScheduleDisplay)
  const upcomingEntries = club.currentBook.schedule
    .map(entry => {
      // Parse date string as local date to avoid timezone issues (same as ReadingScheduleDisplay)
      const [year, month, day] = entry.date.split('-').map(Number);
      const entryDate = new Date(year, month - 1, day);
      entryDate.setHours(0, 0, 0, 0);
      
      return {
        ...entry,
        parsedDate: entryDate
      };
    })
    .filter(entry => entry.parsedDate >= today)
    .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

  return upcomingEntries.length > 0 ? upcomingEntries[0] : null;
};

// Format schedule entry for display (same format as Reading Schedule)
const formatScheduleEntry = (entry: any) => {
  if (!entry) return 'No upcoming meeting';
  
  // Format date the same way as ReadingScheduleDisplay
  if (entry.parsedDate) {
    return entry.parsedDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
  
  return entry.date || 'No upcoming meeting';
};

// Format reading assignment (same format as Reading Schedule)
const formatReadingAssignment = (entry: any) => {
  if (!entry) return '';
  
  // Determine display text based on what's set (same logic as ReadingScheduleDisplay)
  let displayText = '';
  if (entry.pages && entry.pages > 0) {
    displayText = `Read through page ${entry.pages}`;
    if (entry.chapter) {
      displayText += ` (through chapter ${entry.chapter})`;
    }
  } else if (entry.chapter) {
    displayText = `Through Chapter ${entry.chapter}`;
  } else {
    displayText = 'No reading target set';
  }
  
  return displayText;
};

// Club Card Component
interface ClubCardProps {
  club: Club;
  onClubClick: (clubId: string) => void;
  onLongPress: (clubId: string, event: React.MouseEvent) => void;
  onJoinClub?: (clubId: string, event: React.MouseEvent) => void;
  user: any;
  isPrivate?: boolean;
  isMember?: boolean;
}

const ClubCard: React.FC<ClubCardProps> = ({ club, onClubClick, onLongPress, onJoinClub, user, isPrivate = false, isMember = false }) => {
  const isPrivateClub = isPrivate || club.isPublic === false || club.isPublic === undefined;
  const isPublicClub = club.isPublic === true && !isPrivate && !isMember;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: 'white',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        position: 'relative',
        opacity: isPrivateClub && !user ? 0.8 : 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
      onClick={() => onClubClick(club.id)}
      onContextMenu={(e) => onLongPress(club.id, e)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
      }}
    >
      {/* Club Cover */}
      <div
        style={{
          height: '120px',
          background: club.coverImage 
            ? `url(${club.coverImage}) center/cover`
            : `linear-gradient(135deg, ${club.coverColor} 0%, ${club.coverColor}dd 100%)`,
          position: 'relative',
        }}
      >
        {/* Club Name Overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: '0',
            left: '0',
            right: '0',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            padding: '1rem',
            color: 'white',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ 
              fontSize: '1.3rem', 
              fontWeight: 'bold', 
              margin: '0',
              textShadow: '0 1px 3px rgba(0,0,0,0.5)',
              flex: 1
            }}>
              {club.name}
            </h3>
            {club.isPublic === false && (
              <span 
                title="Private Club"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  opacity: 0.9
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </span>
            )}
            {club.isPublic === true && (
              <span 
                title="Public Club"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  opacity: 0.9
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Club Content */}
      <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Next Meeting Info */}
        <div style={{ marginBottom: '1rem', minHeight: '48px' }}>
          <div style={{ 
            fontSize: '0.9rem', 
            color: '#666', 
            marginBottom: '0.25rem',
            fontWeight: '500'
          }}>
            Next Meeting
          </div>
          <div style={{ 
            fontSize: '1rem', 
            color: '#333',
            fontWeight: '600',
            wordWrap: 'break-word',
            overflowWrap: 'break-word'
          }}>
            {(() => {
              const nextEntry = getNextMeeting(club);
              if (nextEntry) {
                const readingText = formatReadingAssignment(nextEntry);
                return (
                  <div>
                    <div>{formatScheduleEntry(nextEntry)}</div>
                    {readingText && (
                      <div style={{
                        fontSize: '0.85rem',
                        color: '#666',
                        fontWeight: '400',
                        marginTop: '0.25rem'
                      }}>
                        {readingText}
                      </div>
                    )}
                  </div>
                );
              }
              // Fallback to old nextMeeting format if no schedule
              if (club.nextMeeting) {
                try {
                  const date = new Date(club.nextMeeting.timestamp);
                  return date.toLocaleDateString('en-US', { 
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  });
                } catch (error) {
                  return 'No upcoming meeting';
                }
              }
              return 'No upcoming meeting';
            })()}
          </div>
        </div>

        {/* Current Book */}
        <div style={{ marginBottom: '1rem', minHeight: '48px' }}>
          {club.currentBook ? (
            <>
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#666', 
                marginBottom: '0.25rem',
                fontWeight: '500'
              }}>
                Current Book
              </div>
              <div style={{ 
                fontSize: '1rem', 
                color: '#333',
                fontWeight: '600',
                wordWrap: 'break-word',
                overflowWrap: 'break-word'
              }}>
                {club.currentBook.title}
                {club.currentBook.author && (
                  <span style={{ color: '#666', fontWeight: 'normal' }}>
                    {' '}by {club.currentBook.author}
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={{ 
                fontSize: '0.9rem', 
                color: '#666', 
                marginBottom: '0.25rem',
                fontWeight: '500'
              }}>
                Current Book
              </div>
              <div style={{ 
                fontSize: '1rem', 
                color: '#999',
                fontWeight: '400',
                fontStyle: 'italic'
              }}>
                No current book
              </div>
            </>
          )}
        </div>

        {/* Highest and Lowest Rated Books */}
        {(() => {
          const { highest, lowest } = getRatedBooks(club);
          if (!highest && !lowest) return null;
          
          return (
            <div style={{ marginBottom: '1rem' }}>
              {highest && (
                <div style={{ marginBottom: '0.5rem' }}>
                  <div style={{ 
                    fontSize: '0.85rem', 
                    color: '#666', 
                    marginBottom: '0.25rem',
                    fontWeight: '500'
                  }}>
                    ⭐ Highest Rated
                  </div>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    color: '#333',
                    fontWeight: '500',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                  }}>
                    {highest.title}
                    {highest.author && (
                      <span style={{ color: '#666', fontWeight: 'normal' }}>
                        {' '}by {highest.author}
                      </span>
                    )}
                    <span style={{ 
                      color: '#10b981', 
                      fontWeight: '600',
                      marginLeft: '0.5rem',
                      fontSize: '0.85rem'
                    }}>
                      {highest.averageRating.toFixed(1)}★
                    </span>
                  </div>
                </div>
              )}
              {lowest && highest?.title !== lowest?.title && (
                <div>
                  <div style={{ 
                    fontSize: '0.85rem', 
                    color: '#666', 
                    marginBottom: '0.25rem',
                    fontWeight: '500'
                  }}>
                    📉 Lowest Rated
                  </div>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    color: '#333',
                    fontWeight: '500',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word'
                  }}>
                    {lowest.title}
                    {lowest.author && (
                      <span style={{ color: '#666', fontWeight: 'normal' }}>
                        {' '}by {lowest.author}
                      </span>
                    )}
                    <span style={{ 
                      color: '#ef4444', 
                      fontWeight: '600',
                      marginLeft: '0.5rem',
                      fontSize: '0.85rem'
                    }}>
                      {lowest.averageRating.toFixed(1)}★
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Member Count and Button Container - ensures consistent bottom spacing */}
        <div style={{ 
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {/* Member Count */}
          <div style={{ 
            fontSize: '0.9rem', 
            color: '#666',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>👥</span>
            <span>{club.memberCount} member{club.memberCount === 1 ? '' : 's'}</span>
          </div>

          {/* Join Club Button - only show for public clubs user is not a member of */}
          {isPublicClub && user && onJoinClub && (
            <button
              onClick={(e) => onJoinClub(club.id, e)}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.85rem',
                fontWeight: '500',
                background: 'transparent',
                color: '#667eea',
                border: '1px solid #667eea',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                width: '100%',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#667eea';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#667eea';
              }}
            >
              Join Club
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const Clubs: React.FC<ClubsProps> = ({ user, db }) => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [publicClubs, setPublicClubs] = useState<Club[]>([]);
  const [privateClubs, setPrivateClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [publicClubsLoading, setPublicClubsLoading] = useState(false);
  const [privateClubsLoading, setPrivateClubsLoading] = useState(false);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);


  // Load clubs based on user authentication status
  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Add a timeout fallback in case Firebase is slow or fails
    const timeoutId = setTimeout(() => {
      console.log('Firebase timeout reached, using fallback data');
      // Use fallback data for non-logged-in users
      if (!user) {
        const fallbackClubs: Club[] = [
          {
            id: 'fallback-1',
            name: 'Fantasy Book Club',
            coverColor: '#667eea',
            currentBook: { title: 'The Name of the Wind', author: 'Patrick Rothfuss' },
            memberCount: 12,
            description: 'A club for fantasy literature enthusiasts',
            booksRead: [],
            members: [],
          },
          {
            id: 'fallback-2',
            name: 'Sci-Fi Readers',
            coverColor: '#764ba2',
            currentBook: { title: 'Dune', author: 'Frank Herbert' },
            memberCount: 8,
            description: 'Exploring the universe through science fiction',
            booksRead: [],
            members: [],
          }
        ];
        setClubs(fallbackClubs);
      } else {
        setClubs([]);
      }
      setLoading(false);
    }, 10000); // 10 second timeout

    if (user) {
      // Load user's clubs from Firebase
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
                      isPublic: clubData.isPublic,
                      meetings: clubData.meetings,
                    });
                  } else {
                    resolve(null); // User is not a member
                  }
                } else {
                  resolve(null); // Club doesn't exist
                }
                unsubscribe();
              });
            });
          });

          Promise.all(clubPromises).then((clubList) => {
            // Filter out null values (clubs user is not a member of)
            const validClubs = clubList.filter((club): club is Club => club !== null);
            clearTimeout(timeoutId);
            setClubs(validClubs);
            setLoading(false);
          });
        } else {
          clearTimeout(timeoutId);
          setClubs([]);
          setLoading(false);
        }
      }, (error) => {
        console.error('Error loading user clubs:', error);
        clearTimeout(timeoutId);
        setClubs([]);
        setLoading(false);
      });
      return () => {
        clearTimeout(timeoutId);
        unsubscribe();
      };
    } else {
      // Load public clubs for non-logged-in users to explore
      const clubsRef = ref(db, 'clubs');
      const unsubscribe = onValue(clubsRef, (snapshot) => {
        const clubsData = snapshot.val();
        
        if (clubsData) {
          // Filter and get public clubs only (isPublic === true or undefined for backward compatibility)
          const publicClubs = Object.entries(clubsData)
            .filter(([clubId, clubData]: [string, any]) => {
              // Only show clubs that are explicitly marked as public
              // For backward compatibility, treat undefined as private
              return clubData.isPublic === true;
            })
            .slice(0, 6)
            .map(([clubId, clubData]: [string, any]) => {
              // Calculate member count from members object
              const membersCount = clubData.members 
                ? (Array.isArray(clubData.members) ? clubData.members.length : Object.keys(clubData.members).length)
                : 0;
              
              return {
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
                isPublic: clubData.isPublic,
                meetings: clubData.meetings,
              };
            });
          clearTimeout(timeoutId);
          setClubs(publicClubs);
        } else {
          clearTimeout(timeoutId);
          setClubs([]);
        }
        setLoading(false);
      }, (error) => {
        console.error('Error loading public clubs:', error);
        console.log('Using fallback clubs due to permission error');
        
        // If it's a permission error, show fallback clubs for non-logged-in users
        if ((error as any).code === 'PERMISSION_DENIED' && !user) {
          const fallbackClubs: Club[] = [
            {
              id: 'fallback-1',
              name: 'Fantasy Book Club',
              coverColor: '#667eea',
              currentBook: { title: 'The Name of the Wind', author: 'Patrick Rothfuss' },
              memberCount: 12,
              description: 'A club for fantasy literature enthusiasts',
              booksRead: [],
              members: [],
            },
            {
              id: 'fallback-2',
              name: 'Sci-Fi Readers',
              coverColor: '#764ba2',
              currentBook: { title: 'Dune', author: 'Frank Herbert' },
              memberCount: 8,
              description: 'Exploring the universe through science fiction',
              booksRead: [],
              members: [],
            },
            {
              id: 'fallback-3',
              name: 'Mystery & Thriller Club',
              coverColor: '#e74c3c',
              currentBook: { title: 'Gone Girl', author: 'Gillian Flynn' },
              memberCount: 15,
              description: 'Solving mysteries one page at a time',
              booksRead: [],
              members: [],
            }
          ];
          clearTimeout(timeoutId);
          setClubs(fallbackClubs);
        } else {
          clearTimeout(timeoutId);
          setClubs([]);
        }
        setLoading(false);
      });
      return () => {
        clearTimeout(timeoutId);
        unsubscribe();
      };
    }
  }, [user, db]);

  // Load private clubs for logged-in users (excluding clubs they're already members of)
  useEffect(() => {
    if (!user || !db) {
      return;
    }

    setPrivateClubsLoading(true);
    const clubsRef = ref(db, 'clubs');
    const unsubscribe = onValue(clubsRef, (snapshot) => {
      const clubsData = snapshot.val();
      
      if (clubsData) {
        // Get list of club IDs user is already a member of
        const userClubIds = new Set(clubs.map(c => c.id));
        
        // Filter and get private clubs only (isPublic === false or undefined), excluding user's clubs
        const privateClubsList = Object.entries(clubsData)
          .filter(([clubId, clubData]: [string, any]) => {
            // Show clubs that are explicitly marked as private (isPublic === false)
            // Or clubs where isPublic is undefined (backward compatibility - treat as private)
            // And exclude clubs user is already a member of
            return (clubData.isPublic === false || clubData.isPublic === undefined) && !userClubIds.has(clubId);
          })
          .slice(0, 12) // Show up to 12 private clubs
          .map(([clubId, clubData]: [string, any]) => {
            // Calculate member count from members object
            const membersCount = clubData.members 
              ? (Array.isArray(clubData.members) ? clubData.members.length : Object.keys(clubData.members).length)
              : 0;
            
            return {
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
              isPublic: clubData.isPublic,
              meetings: clubData.meetings,
            };
          });
        setPrivateClubs(privateClubsList);
      } else {
        setPrivateClubs([]);
      }
      setPrivateClubsLoading(false);
    }, (error) => {
      console.error('Error loading private clubs:', error);
      setPrivateClubs([]);
      setPrivateClubsLoading(false);
    });

    return () => unsubscribe();
  }, [user, db, clubs]);

  // Load public clubs for logged-in users (excluding clubs they're already members of)
  useEffect(() => {
    if (!user || !db) {
      return;
    }

    setPublicClubsLoading(true);
    const clubsRef = ref(db, 'clubs');
    const unsubscribe = onValue(clubsRef, (snapshot) => {
      const clubsData = snapshot.val();
      
      if (clubsData) {
        // Get list of club IDs user is already a member of
        const userClubIds = new Set(clubs.map(c => c.id));
        
        // Filter and get public clubs only, excluding user's clubs
        const publicClubsList = Object.entries(clubsData)
          .filter(([clubId, clubData]: [string, any]) => {
            // Only show clubs that are explicitly marked as public
            // And exclude clubs user is already a member of
            return clubData.isPublic === true && !userClubIds.has(clubId);
          })
          .slice(0, 12) // Show up to 12 public clubs
          .map(([clubId, clubData]: [string, any]) => {
            // Calculate member count from members object
            const membersCount = clubData.members 
              ? (Array.isArray(clubData.members) ? clubData.members.length : Object.keys(clubData.members).length)
              : 0;
            
            return {
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
              isPublic: clubData.isPublic,
              meetings: clubData.meetings,
            };
          });
        setPublicClubs(publicClubsList);
      } else {
        setPublicClubs([]);
      }
      setPublicClubsLoading(false);
    }, (error) => {
      console.error('Error loading public clubs:', error);
      setPublicClubs([]);
      setPublicClubsLoading(false);
    });

    return () => unsubscribe();
  }, [user, db, clubs]);

  // Cache clubs data locally for instant loading (only for logged-in users)
  useEffect(() => {
    if (user && clubs.length > 0) {
      localStorage.setItem('userClubs', JSON.stringify(clubs));
    }
  }, [clubs, user]);

  const handleClubClick = (clubId: string, isPrivate: boolean = false) => {
    // Check if the club is public by looking in the clubs array (for non-logged-in users) or publicClubs array
    const club = clubs.find(c => c.id === clubId) || publicClubs.find(c => c.id === clubId);
    const isPublicClub = club?.isPublic === true;
    
    // If it's a public club, allow navigation even without login
    if (isPublicClub) {
      navigate(`/clubs/${clubId}`);
      return;
    }
    
    // If it's explicitly marked as private and user clicked on it, show message
    if (isPrivate && user) {
      const privateClub = privateClubs.find(c => c.id === clubId);
      if (privateClub) {
        alert('This is a private club. You need to be invited by a member to join.');
        return;
      }
    }
    
    // For non-logged-in users trying to access non-public clubs, show login prompt
    if (!user) {
      // Show login prompt for non-logged-in users
      const shouldLogin = window.confirm(
        'You need to log in to view club details. Would you like to go to the login page?'
      );
      if (shouldLogin) {
        navigate('/login');
      }
      return;
    }
    
    // For logged-in users, navigate and let the club page handle access control
    navigate(`/clubs/${clubId}`);
  };

  const handleLongPress = (clubId: string, event: React.MouseEvent) => {
    event.preventDefault();
    // Only show menu for logged-in users
    if (!user) return;
    setSelectedClubId(clubId);
    setShowMenu(true);
  };

  const handleJoinClub = async (clubId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click
    
    if (!user || !db) {
      return;
    }

    // Check if user is already a member
    const isAlreadyMember = clubs.some(c => c.id === clubId);
    if (isAlreadyMember) {
      alert('You are already a member of this club!');
      return;
    }

    try {
      // Get club data
      const clubRef = ref(db, `clubs/${clubId}`);
      const clubSnapshot = await get(clubRef);
      const clubData = clubSnapshot.val();

      if (!clubData) {
        alert('Club not found');
        return;
      }

      // Check if club is public
      if (clubData.isPublic !== true) {
        alert('This club is private. You need an invitation to join.');
        return;
      }

      // Add user to club's members array
      const members = clubData.members || [];
      const userMember = {
        id: user.uid,
        name: user.displayName || user.email || 'New Member',
        img: user.photoURL || '',
        role: 'member',
        joinedAt: new Date().toISOString()
      };

      // Check if user is already a member (double-check)
      if (!members.some((m: any) => m.id === user.uid)) {
        members.push(userMember);
        await update(clubRef, {
          members: members,
          memberCount: members.length
        });
      }

      // Add club to user's clubs array
      const userRef = ref(db, `users/${user.uid}`);
      const userSnapshot = await get(userRef);
      const userData = userSnapshot.val() || {};
      const userClubs = userData.clubs || [];
      
      if (!userClubs.includes(clubId)) {
        userClubs.push(clubId);
        await update(userRef, { clubs: userClubs });
      }

      // Navigate to the club page
      navigate(`/clubs/${clubId}`);
    } catch (error) {
      console.error('Error joining club:', error);
      alert('Failed to join club. Please try again.');
    }
  };

  const handleMenuAction = async (action: string) => {
    if (!selectedClubId || !user || !db) return;

    switch (action) {
      case 'leave':
        // Remove club from user's clubs
        const userRef = ref(db, `users/${user.uid}`);
        const userSnapshot = await new Promise((resolve) => {
          const unsubscribe = onValue(userRef, (snapshot) => {
            resolve(snapshot);
            unsubscribe();
          });
        });
        const userData = (userSnapshot as any).val();
        if (userData && userData.clubs) {
          const updatedClubs = userData.clubs.filter((id: string) => id !== selectedClubId);
          await update(userRef, { clubs: updatedClubs });
        }
        break;
      case 'details':
        // Navigate to club details (could be a modal or separate page)
        console.log('View details for club:', selectedClubId);
        break;
    }
    
    setShowMenu(false);
    setSelectedClubId(null);
  };



  if (loading) {
    return (
      <>
        <HeaderBar user={user} db={db} />
        <div style={{ marginTop: 'calc(60px + var(--feedback-banner-height, 60px) + 20px)', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', color: '#666' }}>
            {user ? 'Loading your clubs...' : 'Loading clubs...'}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <HeaderBar user={user} db={db} />
      <div style={{ marginTop: 'calc(60px + var(--feedback-banner-height, 60px) + 20px)', minHeight: 'calc(100vh - 60px - var(--feedback-banner-height, 60px) - 20px)', background: '#f8f9fa' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
              <div>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#333', marginBottom: '0.5rem' }}>
                  {user ? 'My Clubs' : 'Explore Clubs'}
                </h1>
                <p style={{ color: '#666', fontSize: '1.1rem' }}>
                  {user ? (
                    clubs.length === 0 
                      ? "You're not part of any clubs yet. Join a club to get started!"
                      : `You're part of ${clubs.length} club${clubs.length === 1 ? '' : 's'}`
                  ) : (
                    clubs.length === 0 
                      ? "Discover amazing book clubs and join the reading community!"
                      : `Explore ${clubs.length} book club${clubs.length === 1 ? '' : 's'} and find your next read`
                  )}
                </p>
              </div>
              {user && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  + Create Club
                </button>
              )}
            </div>
            {!user && (
              <div style={{ marginTop: '1rem' }}>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  Sign In to Join Clubs
                </button>
              </div>
            )}
          </div>

          {/* My Clubs Section - only show header for logged-in users */}
          {user && (
            <div style={{ marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#333', marginBottom: '1.5rem' }}>
                My Clubs
              </h2>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
                gap: '1.5rem' 
              }}>
                {clubs.map((club) => (
                  <ClubCard
                    key={club.id}
                    club={club}
                    onClubClick={handleClubClick}
                    onLongPress={handleLongPress}
                    user={user}
                    isMember={true}
                  />
                ))}

                {/* Show "No clubs" message if no clubs available */}
                {clubs.length === 0 && (
                  <div style={{ 
                    gridColumn: '1 / -1',
                    textAlign: 'center', 
                    padding: '1.5rem',
                    color: '#999',
                    fontSize: '0.95rem',
                    fontStyle: 'italic'
                  }}>
                    No clubs yet. Join more book clubs to expand your reading community.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Private Clubs Section - show for logged-in users */}
          {user && (
            <div style={{ marginTop: user ? '3rem' : '0', marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#333', marginBottom: '1.5rem' }}>
                Private Clubs
              </h2>
              <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                These clubs are private. You can view them but need an invitation to join.
              </p>
              {privateClubsLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  Loading private clubs...
                </div>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
                  gap: '1.5rem' 
                }}>
                  {privateClubs.map((club) => (
                    <ClubCard
                      key={club.id}
                      club={club}
                      onClubClick={(id) => handleClubClick(id, true)}
                      onLongPress={handleLongPress}
                      user={user}
                      isPrivate={true}
                    />
                  ))}

                  {/* Show "No private clubs" message if no clubs available */}
                  {privateClubs.length === 0 && !privateClubsLoading && (
                    <div style={{ 
                      gridColumn: '1 / -1',
                      textAlign: 'center', 
                      padding: '1.5rem',
                      color: '#999',
                      fontSize: '0.95rem',
                      fontStyle: 'italic'
                    }}>
                      No private clubs available. Private clubs require an invitation to join.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Public Clubs Section - show for logged-in users */}
          {user && (
            <div style={{ marginTop: user ? '3rem' : '0', marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#333', marginBottom: '1.5rem' }}>
                Public Clubs
              </h2>
              {publicClubsLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  Loading public clubs...
                </div>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
                  gap: '1.5rem' 
                }}>
                  {publicClubs.map((club) => (
                    <ClubCard
                      key={club.id}
                      club={club}
                      onClubClick={handleClubClick}
                      onLongPress={handleLongPress}
                      onJoinClub={handleJoinClub}
                      user={user}
                      isMember={false}
                    />
                  ))}

                  {/* Show "No public clubs" message if no clubs available */}
                  {publicClubs.length === 0 && !publicClubsLoading && (
                    <div style={{ 
                      gridColumn: '1 / -1',
                      textAlign: 'center', 
                      padding: '1.5rem',
                      color: '#999',
                      fontSize: '0.95rem',
                      fontStyle: 'italic'
                    }}>
                      No public clubs available. Check back later for new clubs to explore.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* For non-logged-in users, show clubs as before */}
          {!user && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
              gap: '1.5rem' 
            }}>
              {clubs.map((club) => (
                <ClubCard
                  key={club.id}
                  club={club}
                  onClubClick={handleClubClick}
                  onLongPress={handleLongPress}
                  user={null}
                />
              ))}

              {/* Show "No clubs" message if no clubs available */}
              {clubs.length === 0 && (
                <div style={{ 
                  gridColumn: '1 / -1',
                  textAlign: 'center', 
                  padding: '1.5rem',
                  color: '#999',
                  fontSize: '0.95rem',
                  fontStyle: 'italic'
                }}>
                  {user 
                    ? 'No clubs available. Join more book clubs to expand your reading community.'
                    : 'No clubs available. Check back later for new book clubs to explore.'
                  }
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Long Press Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
            }}
            onClick={() => setShowMenu(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1rem',
                minWidth: '200px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ 
                fontSize: '1.1rem', 
                fontWeight: 'bold', 
                marginBottom: '1rem',
                textAlign: 'center',
                color: '#333'
              }}>
                Club Options
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button
                  onClick={() => handleMenuAction('details')}
                  style={{
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    textAlign: 'left',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  📋 View Details
                </button>
                <button
                  onClick={() => handleMenuAction('leave')}
                  style={{
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    borderRadius: '6px',
                    textAlign: 'left',
                    transition: 'background 0.2s ease',
                    color: '#ff4757',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ffe6e6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  🚪 Leave Club
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Club Modal */}
      {user && (
        <CreateClubModal 
          show={showCreateModal} 
          onClose={() => setShowCreateModal(false)} 
          user={user} 
          db={db} 
        />
      )}
    </>
  );
};

export default Clubs;
