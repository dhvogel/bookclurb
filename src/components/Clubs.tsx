import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { Database, ref, onValue, update } from 'firebase/database';
import HeaderBar from './HeaderBar';
import { motion, AnimatePresence } from 'framer-motion';
import { ClubsProps } from '../types';

interface Club {
  id: string;
  name: string;
  coverImage?: string;
  coverColor?: string;
  nextMeeting?: {
    date: string;
    time: string;
    location?: string;
  };
  currentBook?: {
    title: string;
    author?: string;
  };
  unreadActivity: number;
  memberCount: number;
  description?: string;
}

const Clubs: React.FC<ClubsProps> = ({ user, db }) => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false); // TODO: Change to true when Firebase is implemented
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  // Initialize with SOM Book Club
  useEffect(() => {
    setClubs([
      {
        id: 'bookclubid1',
        name: 'SOM Book Club',
        coverColor: '#00356b',
        nextMeeting: { date: 'Oct 30, 2025', time: '6:00 PM EDT', location: 'WhatsApp' },
        currentBook: { title: 'Empire of Pain', author: 'Patrick Radden Keefe' },
        unreadActivity: 0,
        memberCount: 10,
      }
    ]);
  }, []);

  // Load user's clubs from Firebase
  // useEffect(() => {
  //   if (!user || !db) {
  //     setLoading(false);
  //     return;
  //   }

  //   const userRef = ref(db, `users/${user.uid}`);
  //   const unsubscribe = onValue(userRef, (snapshot) => {
  //     const userData = snapshot.val();
  //     if (userData && userData.clubs) {
  //       // Fetch club details for each club ID
  //       const clubPromises = userData.clubs.map(async (clubId: string) => {
  //         const clubRef = ref(db, `clubs/${clubId}`);
  //         return new Promise<Club>((resolve) => {
  //           const unsubscribe = onValue(clubRef, (clubSnapshot) => {
  //             const clubData = clubSnapshot.val();
  //             if (clubData) {
  //               resolve({
  //                 id: clubId,
  //                 name: clubData.name || 'Untitled Club',
  //                 coverImage: clubData.coverImage,
  //                 coverColor: clubData.coverColor || '#667eea',
  //                 nextMeeting: clubData.nextMeeting,
  //                 currentBook: clubData.currentBook,
  //                 unreadActivity: clubData.unreadActivity || 0,
  //                 memberCount: clubData.memberCount || 0,
  //                 description: clubData.description,
  //               });
  //               unsubscribe();
  //             }
  //           });
  //         });
  //       });

  //       Promise.all(clubPromises).then((clubList) => {
  //         setClubs(clubList);
  //         setLoading(false);
  //       });
  //     } else {
  //       setClubs([]);
  //       setLoading(false);
  //     }
  //   });

  //   return () => unsubscribe();
  // }, [user, db]);

  // Cache clubs data locally for instant loading
  useEffect(() => {
    if (clubs.length > 0) {
      localStorage.setItem('userClubs', JSON.stringify(clubs));
    }
  }, [clubs]);

  // Load cached data on mount
  useEffect(() => {
    const cachedClubs = localStorage.getItem('userClubs');
    if (cachedClubs && !user) {
      setClubs(JSON.parse(cachedClubs));
      setLoading(false);
    }
  }, [user]);

  const handleClubClick = (clubId: string) => {
    navigate(`/clubs/${clubId}`);
  };

  const handleLongPress = (clubId: string, event: React.MouseEvent) => {
    event.preventDefault();
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
    return `${nextMeeting.date} ${nextMeeting.time}`;
  };

  if (loading) {
    return (
      <>
        <HeaderBar user={user} db={db} />
        <div style={{ marginTop: '80px', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', color: '#666' }}>Loading your clubs...</div>
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
              My Clubs
            </h1>
            <p style={{ color: '#666', fontSize: '1.1rem' }}>
              {clubs.length === 0 
                ? "You're not part of any clubs yet. Join a club to get started!"
                : `You're part of ${clubs.length} club${clubs.length === 1 ? '' : 's'}`
              }
            </p>
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
                    {/* Unread Activity Badge */}
                    {club.unreadActivity > 0 && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: '#ff4757',
                          color: 'white',
                          borderRadius: '20px',
                          padding: '4px 8px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          minWidth: '20px',
                          textAlign: 'center',
                        }}
                      >
                        {club.unreadActivity}
                      </div>
                    )}
                    
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

            {/* Show "No other clubs" message if no Firebase clubs */}
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
                  No other clubs yet
                </h3>
                <p style={{ color: '#666', marginBottom: '2rem' }}>
                  Join more book clubs to expand your reading community
                </p>
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
