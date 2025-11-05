import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, ref, onValue, update } from 'firebase/database';
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

const Clubs: React.FC<ClubsProps> = ({ user, db }) => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Cache clubs data locally for instant loading (only for logged-in users)
  useEffect(() => {
    if (user && clubs.length > 0) {
      localStorage.setItem('userClubs', JSON.stringify(clubs));
    }
  }, [clubs, user]);

  const handleClubClick = (clubId: string) => {
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
    navigate(`/clubs/${clubId}`);
  };

  const handleLongPress = (clubId: string, event: React.MouseEvent) => {
    event.preventDefault();
    // Only show menu for logged-in users
    if (!user) return;
    setSelectedClubId(clubId);
    setShowMenu(true);
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
        <div style={{ marginTop: '80px', padding: '2rem', textAlign: 'center' }}>
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
      <div style={{ marginTop: '80px', minHeight: 'calc(100vh - 80px)', background: '#f8f9fa' }}>
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
                  data-tour="create-club-button"
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

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
            gap: '1.5rem' 
          }}>
              {clubs.map((club) => (
                <motion.div
                  key={club.id}
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
                  }}
                  onClick={() => handleClubClick(club.id)}
                  onContextMenu={(e) => handleLongPress(club.id, e)}
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
                  <div style={{ padding: '1.5rem', minHeight: '200px', display: 'flex', flexDirection: 'column' }}>
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

                    {/* Member Count */}
                    <div style={{ 
                      fontSize: '0.9rem', 
                      color: '#666',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginTop: 'auto'
                    }}>
                      <span>👥</span>
                      <span>{club.memberCount} member{club.memberCount === 1 ? '' : 's'}</span>
                    </div>
                  </div>
                </motion.div>
              ))}

            {/* Show "No clubs" message if no clubs available */}
            {clubs.length === 0 && (
              <div style={{ 
                gridColumn: '1 / -1',
                textAlign: 'center', 
                padding: '4rem 2rem',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
              }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
                <h3 style={{ fontSize: '1.5rem', color: '#333', marginBottom: '1rem' }}>
                  {user ? 'No clubs yet' : 'No clubs available'}
                </h3>
                <p style={{ color: '#666', marginBottom: '2rem' }}>
                  {user 
                    ? 'Join more book clubs to expand your reading community'
                    : 'Check back later for new book clubs to explore'
                  }
                </p>
                {user && (
                  <button
                    onClick={() => navigate('/people')}
                    style={{
                      padding: '1rem 2rem',
                      fontSize: '1.1rem',
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
                    Explore More Clubs
                  </button>
                )}
              </div>
            )}
          </div>
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
