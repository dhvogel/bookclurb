import React, { useState, useEffect } from "react";
import HeaderBar from "./HeaderBar";
import { getAuth, signOut } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { ProfileProps, Club } from "../types";

const Profile: React.FC<ProfileProps> = ({ user, db }) => {
  const navigate = useNavigate();
  const [clubs, setClubs] = useState<Club[]>([]);
  const [clubsLoading, setClubsLoading] = useState(true);

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
                          overflow: "hidden"
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
                            color: "#6c757d"
                          }}>
                            <span>👥 {club.memberCount} members</span>
                          </div>
                          
                          {club.currentBook && (
                            <div style={{ 
                              marginTop: "0.75rem",
                              paddingTop: "0.75rem",
                              borderTop: "1px solid #e9ecef",
                              fontSize: "0.875rem",
                              color: "#495057"
                            }}>
                              <strong>Current Book:</strong> {club.currentBook.title}
                            </div>
                          )}
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
    </div>
  );
};

export default Profile;
