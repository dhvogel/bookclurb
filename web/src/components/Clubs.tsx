import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, ref, onValue, update } from 'firebase/database';
import HeaderBar from './HeaderBar';
import { motion, AnimatePresence } from 'framer-motion';
import { ClubsProps, Club } from '../types';
import { extractClubBooksRead } from '../utils/bookUtils';

const Clubs: React.FC<ClubsProps> = ({ user, db }) => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);


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
                    resolve({
                      id: clubId,
                      name: clubData.name || 'Untitled Club',
                      coverImage: clubData.coverImage,
                      coverColor: clubData.coverColor || '#667eea',
                      nextMeeting: clubData.nextMeeting,
                      currentBook: clubData.currentBook,
                      memberCount: clubData.memberCount || 0,
                      description: clubData.description,
                      booksRead: clubData.booksRead,
                      members: clubData.members,
                      recentActivity: clubData.recentActivity,
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
          // Get a few clubs for exploration (limit to 6)
          const publicClubs = Object.entries(clubsData)
            .slice(0, 6)
            .map(([clubId, clubData]: [string, any]) => ({
              id: clubId,
              name: clubData.name || 'Untitled Club',
              coverImage: clubData.coverImage,
              coverColor: clubData.coverColor || '#667eea',
              nextMeeting: clubData.nextMeeting,
              currentBook: clubData.currentBook,
              memberCount: clubData.memberCount || 0,
              description: clubData.description,
              booksRead: clubData.booksRead,
              members: clubData.members,
              recentActivity: clubData.recentActivity,
            }));
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
      case 'mute':
        // Toggle notification muting
        const notificationRef = ref(db, `users/${user.uid}/mutedClubs/${selectedClubId}`);
        await update(notificationRef, { muted: true });
        break;
    }
    
    setShowMenu(false);
    setSelectedClubId(null);
  };

  const formatNextMeeting = (nextMeeting?: Club['nextMeeting']) => {
    if (!nextMeeting) return 'No upcoming meeting';
    
    try {
      const date = new Date(nextMeeting.timestamp);
      const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      const formattedTime = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      return `${formattedDate} ${formattedTime}`;
    } catch (error) {
      return 'Invalid meeting date';
    }
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
                      <h3 style={{ 
                        fontSize: '1.3rem', 
                        fontWeight: 'bold', 
                        margin: '0',
                        textShadow: '0 1px 3px rgba(0,0,0,0.5)'
                      }}>
                        {club.name}
                      </h3>
                    </div>
                  </div>

                  {/* Club Content */}
                  <div style={{ padding: '1.5rem' }}>
                    {/* Next Meeting Info */}
                    <div style={{ marginBottom: '1rem' }}>
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
                        fontWeight: '600'
                      }}>
                        {formatNextMeeting(club.nextMeeting)}
                      </div>
                    </div>

                    {/* Current Book */}
                    {club.currentBook && (
                      <div style={{ marginBottom: '1rem' }}>
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
                          fontWeight: '600'
                        }}>
                          {club.currentBook.title}
                          {club.currentBook.author && (
                            <span style={{ color: '#666', fontWeight: 'normal' }}>
                              {' '}by {club.currentBook.author}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Member Count */}
                    <div style={{ 
                      fontSize: '0.9rem', 
                      color: '#666',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span>👥</span>
                      {/* TODO: Figure out where this memberCount is coming from and change it to 10*/}
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
                  onClick={() => handleMenuAction('mute')}
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
                  🔇 Mute Notifications
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
    </>
  );
};

export default Clubs;
