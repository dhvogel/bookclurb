import React, { useState, useEffect } from "react";
import HeaderBar from "./HeaderBar";
import { getAuth, signOut } from "firebase/auth";
import { ref, onValue, get, update } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ProfileProps, Club } from "../types";

const Profile: React.FC<ProfileProps> = ({ user, db }) => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubsLoading, setClubsLoading] = useState(true);
  const [clubToLeave, setClubToLeave] = useState<{ id: string; name: string } | null>(null);
  const [leavingClub, setLeavingClub] = useState(false);
  const [openSettingsMenu, setOpenSettingsMenu] = useState<string | null>(null);

  // Load user's clubs
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

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleClubClick = (clubId: string) => {
    navigate(`/clubs/${clubId}`);
  };

  const handleLeaveClubClick = (clubId: string, clubName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking leave button
    setClubToLeave({ id: clubId, name: clubName });
  };

  const handleLeaveClubConfirm = async () => {
    if (!clubToLeave || !user || !db) {
      return;
    }

    setLeavingClub(true);

    try {
      const { id: clubId, name: clubName } = clubToLeave;
      // Remove club ID from user's clubs array
      const userRef = ref(db, `users/${user.uid}`);
      const userSnapshot = await get(userRef);
      const userData = userSnapshot.val() || {};
      const userClubs = userData.clubs || [];
      
      const updatedClubs = userClubs.filter((id: string) => id !== clubId);
      await update(userRef, { clubs: updatedClubs });

      // Remove user from club's members
      const clubRef = ref(db, `clubs/${clubId}`);
      const clubSnapshot = await get(clubRef);
      const clubData = clubSnapshot.val();

      if (clubData && clubData.members) {
        let updatedMembers: any[] | { [key: string]: any };
        let updatedMemberCount: number;

        if (Array.isArray(clubData.members)) {
          // Members is an array
          updatedMembers = clubData.members.filter((member: any) => member && member.id !== user.uid);
          updatedMemberCount = (updatedMembers as any[]).length;
        } else {
          // Members is an object (key-value pairs)
          updatedMembers = {};
          let count = 0;
          Object.keys(clubData.members).forEach((key) => {
            const member = clubData.members[key];
            if (member && member.id !== user.uid) {
              (updatedMembers as { [key: string]: any })[key] = member;
              count++;
            }
          });
          updatedMemberCount = count;
        }

        // Update club with new members list and member count
        await update(clubRef, {
          members: updatedMembers,
          memberCount: updatedMemberCount,
        });
      }

      // Remove club from local state immediately for better UX
      setClubs((prevClubs) => prevClubs.filter((club) => club.id !== clubId));
      
      // Close modal
      setClubToLeave(null);
    } catch (error) {
      console.error("Error leaving club:", error);
      alert("Failed to leave club. Please try again.");
    } finally {
      setLeavingClub(false);
    }
  };

  const handleLeaveClubCancel = () => {
    setClubToLeave(null);
  };

  const handleSettingsClick = (clubId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking settings button
    e.preventDefault(); // Prevent any default behavior
    setOpenSettingsMenu(openSettingsMenu === clubId ? null : clubId);
  };

  // Close settings menu when clicking outside
  useEffect(() => {
    if (!openSettingsMenu) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if clicking on the settings button or dropdown
      const target = event.target as HTMLElement;
      const settingsMenu = target.closest('[data-settings-menu]');
      if (settingsMenu) {
        return;
      }
      setOpenSettingsMenu(null);
    };
    
    // Add listener after current event cycle completes
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openSettingsMenu]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <HeaderBar user={user} db={db} />
      
      <div style={{ 
        paddingTop: "100px", 
        paddingBottom: "2rem",
        maxWidth: "1200px", 
        margin: "0 auto",
        paddingLeft: "1rem",
        paddingRight: "1rem"
      }}>
        <div style={{
          backgroundColor: "white",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
          padding: "2rem",
          marginBottom: "2rem"
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            marginBottom: "2rem",
            paddingBottom: "1.5rem",
            borderBottom: "1px solid #e9ecef"
          }}>
            <div style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              backgroundColor: "#00356B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "1.5rem",
              fontSize: "2rem",
              color: "white",
              fontWeight: "bold"
            }}>
              {user?.email?.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <h1 style={{ 
                margin: 0, 
                fontSize: "1.75rem", 
                fontWeight: "600",
                color: "#212529",
                marginBottom: "0.25rem"
              }}>
                Profile
              </h1>
              <p style={{ 
                margin: 0, 
                color: "#6c757d", 
                fontSize: "1rem"
              }}>
                Manage your account settings
              </p>
            </div>
          </div>

          {user ? (
            <div>
              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ 
                  margin: "0 0 0.75rem 0", 
                  fontSize: "1.1rem", 
                  fontWeight: "600",
                  color: "#495057"
                }}>
                  Account Information
                </h3>
                <div style={{
                  backgroundColor: "#f8f9fa",
                  borderRadius: "8px",
                  padding: "1rem",
                  border: "1px solid #e9ecef"
                }}>
                  <div style={{ marginBottom: "0.75rem" }}>
                    <label style={{ 
                      display: "block", 
                      fontSize: "0.875rem", 
                      fontWeight: "500",
                      color: "#6c757d",
                      marginBottom: "0.25rem"
                    }}>
                      Email Address
                    </label>
                    <div style={{ 
                      fontSize: "1rem", 
                      color: "#212529",
                      fontWeight: "500"
                    }}>
                      {user.email}
                    </div>
                  </div>
                  {user.displayName && (
                    <div>
                      <label style={{ 
                        display: "block", 
                        fontSize: "0.875rem", 
                        fontWeight: "500",
                        color: "#6c757d",
                        marginBottom: "0.25rem"
                      }}>
                        Display Name
                      </label>
                      <div style={{ 
                        fontSize: "1rem", 
                        color: "#212529",
                        fontWeight: "500"
                      }}>
                        {user.displayName}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ 
                  margin: "0 0 0.75rem 0", 
                  fontSize: "1.1rem", 
                  fontWeight: "600",
                  color: "#495057"
                }}>
                  My Clubs
                </h3>
                {clubsLoading ? (
                  <div style={{
                    backgroundColor: "#f8f9fa",
                    borderRadius: "8px",
                    padding: "2rem",
                    border: "1px solid #e9ecef",
                    textAlign: "center",
                    color: "#6c757d"
                  }}>
                    Loading clubs...
                  </div>
                ) : clubs.length === 0 ? (
                  <div style={{
                    backgroundColor: "#f8f9fa",
                    borderRadius: "8px",
                    padding: "2rem",
                    border: "1px solid #e9ecef",
                    textAlign: "center",
                    color: "#6c757d"
                  }}>
                    You're not part of any clubs yet.
                  </div>
                ) : (
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "1rem"
                  }}>
                    {clubs.map((club) => (
                      <div
                        key={club.id}
                        onClick={() => handleClubClick(club.id)}
                        style={{
                          backgroundColor: "white",
                          borderRadius: "12px",
                          border: "1px solid #e9ecef",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                          overflow: openSettingsMenu === club.id ? "visible" : "hidden"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.05)";
                        }}
                      >
                        {/* Club Cover */}
                        <div style={{
                          height: "120px",
                          backgroundColor: club.coverColor || "#667eea",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "2.5rem",
                          color: "white",
                          fontWeight: "bold"
                        }}>
                          {club.name.charAt(0).toUpperCase()}
                        </div>
                        
                        {/* Club Info */}
                        <div style={{ padding: "1rem" }}>
                          <h4 style={{ 
                            margin: "0 0 0.5rem 0",
                            fontSize: "1.1rem",
                            fontWeight: "600",
                            color: "#212529"
                          }}>
                            {club.name}
                          </h4>
                          
                          {club.description && (
                            <p style={{ 
                              margin: "0 0 0.5rem 0",
                              fontSize: "0.875rem",
                              color: "#6c757d",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden"
                            }}>
                              {club.description}
                            </p>
                          )}
                          
                          <div style={{ 
                            display: "flex", 
                            alignItems: "center",
                            gap: "0.5rem",
                            fontSize: "0.875rem",
                            color: "#6c757d",
                            marginBottom: "0.75rem"
                          }}>
                            <span>👥 {club.memberCount} members</span>
                          </div>
                          
                          {club.currentBook && (
                            <div style={{ 
                              marginBottom: "0.75rem",
                              paddingBottom: "0.75rem",
                              borderBottom: "1px solid #e9ecef",
                              fontSize: "0.875rem",
                              color: "#495057"
                            }}>
                              <strong>Current Book:</strong> {club.currentBook.title}
                            </div>
                          )}
                          
                          <div style={{ position: "relative" }} data-settings-menu>
                            <button
                              onClick={(e) => handleSettingsClick(club.id, e)}
                              data-settings-menu
                              style={{
                                width: "100%",
                                backgroundColor: "#f8f9fa",
                                color: "#495057",
                                border: "1px solid #dee2e6",
                                borderRadius: "6px",
                                padding: "0.5rem",
                                fontSize: "0.875rem",
                                fontWeight: "500",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.5rem"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#e9ecef";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#f8f9fa";
                              }}
                            >
                              ⚙️ Settings
                            </button>
                            
                            {openSettingsMenu === club.id && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                onClick={(e) => e.stopPropagation()}
                                data-settings-menu
                                style={{
                                  position: "absolute",
                                  top: "100%",
                                  left: 0,
                                  right: 0,
                                  marginTop: "0.25rem",
                                  backgroundColor: "white",
                                  border: "1px solid #dee2e6",
                                  borderRadius: "6px",
                                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                                  zIndex: 10000,
                                  overflow: "visible",
                                  minHeight: "auto",
                                  visibility: "visible"
                                }}
                              >
                                <button
                                  onClick={(e) => handleLeaveClubClick(club.id, club.name, e)}
                                  style={{
                                    width: "100%",
                                    backgroundColor: "#fff",
                                    color: "#dc3545",
                                    border: "none",
                                    borderRadius: "0",
                                    padding: "0.75rem 1rem",
                                    fontSize: "0.875rem",
                                    fontWeight: "500",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    textAlign: "left"
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#fff5f5";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "#fff";
                                  }}
                                >
                                  🚪 Leave Club
                                </button>
                              </motion.div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ 
                display: "flex", 
                gap: "1rem",
                flexWrap: "wrap"
              }}>
                <button 
                  onClick={handleLogout} 
                  style={{ 
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "0.75rem 1.5rem",
                    fontSize: "1rem",
                    fontWeight: "500",
                    cursor: "pointer",
                    transition: "background-color 0.2s ease",
                    boxShadow: "0 2px 4px rgba(220, 53, 69, 0.2)"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#c82333";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#dc3545";
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: "center",
              padding: "3rem 1rem",
              color: "#6c757d"
            }}>
              <div style={{
                fontSize: "3rem",
                marginBottom: "1rem",
                opacity: 0.5
              }}>
                👤
              </div>
              <h3 style={{ 
                margin: "0 0 0.5rem 0", 
                fontSize: "1.25rem",
                color: "#495057"
              }}>
                Not Signed In
              </h3>
              <p style={{ margin: 0 }}>
                Please sign in to view your profile
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Leave Club Confirmation Modal */}
      <AnimatePresence>
        {clubToLeave && (
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
            onClick={handleLeaveClubCancel}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                minWidth: '400px',
                maxWidth: '500px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                marginBottom: '1rem',
                color: '#333'
              }}>
                Leave Club?
              </div>
              
              <p style={{
                marginBottom: '1.5rem',
                color: '#666',
                lineHeight: '1.6'
              }}>
                Are you sure you want to leave <strong>"{clubToLeave.name}"</strong>?
              </p>

              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                justifyContent: 'flex-end' 
              }}>
                <button
                  onClick={handleLeaveClubCancel}
                  disabled={leavingClub}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: '500',
                    background: '#f8f9fa',
                    color: '#495057',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    cursor: leavingClub ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s ease',
                    opacity: leavingClub ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!leavingClub) {
                      e.currentTarget.style.backgroundColor = '#e9ecef';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!leavingClub) {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLeaveClubConfirm}
                  disabled={leavingClub}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: '500',
                    background: leavingClub ? '#ccc' : '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: leavingClub ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s ease',
                    opacity: leavingClub ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!leavingClub) {
                      e.currentTarget.style.backgroundColor = '#c82333';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!leavingClub) {
                      e.currentTarget.style.backgroundColor = '#dc3545';
                    }
                  }}
                >
                  {leavingClub ? 'Leaving...' : 'Leave Club'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
