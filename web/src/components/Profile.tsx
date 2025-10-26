import React from "react";
import HeaderBar from "./HeaderBar";
import { getAuth, signOut } from "firebase/auth";
import { ProfileProps } from "../types";

const Profile: React.FC<ProfileProps> = ({ user, db }) => {
  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fa" }}>
      <HeaderBar user={user} db={db} />
      
      <div style={{ 
        paddingTop: "100px", 
        paddingBottom: "2rem",
        maxWidth: "800px", 
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
