import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Database } from 'firebase/database';
import { ref, get, update } from 'firebase/database';
import { testHardcoverToken } from '../../../../utils/hardcoverApi';

interface AccountInfoProps {
  user: User;
  db: Database;
}

const AccountInfo: React.FC<AccountInfoProps> = ({ user, db }) => {
  const [hardcoverToken, setHardcoverToken] = useState<string>('');
  const [hardcoverUser, setHardcoverUser] = useState<{ id: string; username: string; cachedImageUrl?: string } | null>(null);
  const [isEditingToken, setIsEditingToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHardcoverToken = async () => {
      if (!user || !db) {
        setIsLoading(false);
        return;
      }

      try {
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();
        
        if (userData?.hardcoverApiToken) {
          setHardcoverToken(userData.hardcoverApiToken);
          
          // Load Hardcover user info if token exists
          if (userData.hardcoverApiToken) {
            const testResult = await testHardcoverToken(userData.hardcoverApiToken);
            if (testResult.valid && testResult.user) {
              setHardcoverUser(testResult.user);
            }
          }
        }
      } catch (error) {
        console.error('Error loading Hardcover token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHardcoverToken();
  }, [user, db]);


  const handleSaveToken = async () => {
    if (!user || !db) return;

    // Strip "Bearer " prefix if user included it
    const token = hardcoverToken.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      window.alert('Please enter a Hardcover API token.');
      return;
    }

    setIsSaving(true);
    try {
      // Test the token before saving
      const testResult = await testHardcoverToken(token);
      
      if (!testResult.valid) {
        const errorMsg = testResult.error 
          ? `Invalid API token: ${testResult.error}. Please check your token and try again. You can get your token from https://hardcover.app/settings/api`
          : 'Invalid API token. Please check your token and try again. You can get your token from https://hardcover.app/settings/api';
        window.alert(errorMsg);
        setIsSaving(false);
        return;
      }

      // Token is valid, save it and store user info
      const userRef = ref(db, `users/${user.uid}`);
      await update(userRef, {
        hardcoverApiToken: token
      });
      
      // Store user info
      if (testResult.user) {
        setHardcoverUser(testResult.user);
      }
      
      setIsEditingToken(false);
      window.alert('Hardcover account linked successfully!');
    } catch (error) {
      console.error('Error saving Hardcover token:', error);
      window.alert('Failed to save Hardcover API token. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveToken = async () => {
    if (!user || !db) return;

    if (!window.confirm('Are you sure you want to unlink your Hardcover account? Reviews will no longer be uploaded automatically.')) {
      return;
    }

    setIsSaving(true);
    try {
      const userRef = ref(db, `users/${user.uid}`);
      await update(userRef, {
        hardcoverApiToken: null
      });
      setHardcoverToken('');
      setHardcoverUser(null);
      setIsEditingToken(false);
    } catch (error) {
      console.error('Error removing Hardcover token:', error);
      window.alert('Failed to unlink Hardcover account. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const isLinked = hardcoverToken.trim().length > 0 && hardcoverUser !== null;

  return (
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
          <div style={{ marginBottom: "0.75rem" }}>
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

      {/* Hardcover Integration Section */}
      <div style={{ marginTop: "2rem" }}>
        <h3 style={{ 
          margin: "0 0 0.75rem 0", 
          fontSize: "1.1rem", 
          fontWeight: "600",
          color: "#495057"
        }}>
          Hardcover Integration
        </h3>
        <div style={{
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          padding: "1rem",
          border: "1px solid #e9ecef"
        }}>
          <p style={{ 
            margin: "0 0 1rem 0",
            fontSize: "0.875rem",
            color: "#6c757d",
            lineHeight: "1.5"
          }}>
            Link your Hardcover account to automatically upload your book reviews from BookClurb to Hardcover.
          </p>

          {isLoading ? (
            <div style={{ color: "#6c757d", fontSize: "0.875rem" }}>
              Loading...
            </div>
          ) : isEditingToken ? (
            <div>
              <label style={{ 
                display: "block", 
                fontSize: "0.875rem", 
                fontWeight: "500",
                color: "#6c757d",
                marginBottom: "0.5rem"
              }}>
                Hardcover API Token
              </label>
              <input
                type="password"
                value={hardcoverToken}
                onChange={(e) => setHardcoverToken(e.target.value)}
                placeholder="Enter your Hardcover API token (just the token, not 'Bearer')"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  fontSize: "0.875rem",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  marginBottom: "0.75rem",
                  fontFamily: "monospace"
                }}
              />
              <div style={{ 
                fontSize: "0.75rem", 
                color: "#6c757d",
                marginBottom: "0.75rem"
              }}>
                <a 
                  href="https://hardcover.app/settings/api" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: "#00356B", textDecoration: "underline" }}
                >
                  Get your API token from Hardcover settings →
                </a>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={handleSaveToken}
                  disabled={isSaving}
                  style={{
                    backgroundColor: "#00356B",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    padding: "0.5rem 1rem",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    cursor: isSaving ? "not-allowed" : "pointer",
                    opacity: isSaving ? 0.6 : 1,
                    transition: "background-color 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    if (!isSaving) {
                      e.currentTarget.style.backgroundColor = "#002a52";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSaving) {
                      e.currentTarget.style.backgroundColor = "#00356B";
                    }
                  }}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setIsEditingToken(false);
                    // Reload token and user info from database
                    const reloadToken = async () => {
                      try {
                        const userRef = ref(db, `users/${user.uid}`);
                        const snapshot = await get(userRef);
                        const userData = snapshot.val();
                        const token = userData?.hardcoverApiToken || '';
                        setHardcoverToken(token);
                        
                        // Reload user info if token exists
                        if (token) {
                          const testResult = await testHardcoverToken(token);
                          if (testResult.valid && testResult.user) {
                            setHardcoverUser(testResult.user);
                          } else {
                            setHardcoverUser(null);
                          }
                        } else {
                          setHardcoverUser(null);
                        }
                      } catch (error) {
                        console.error('Error reloading token:', error);
                      }
                    };
                    reloadToken();
                  }}
                  disabled={isSaving}
                  style={{
                    backgroundColor: "transparent",
                    color: "#6c757d",
                    border: "1px solid #ced4da",
                    borderRadius: "4px",
                    padding: "0.5rem 1rem",
                    fontSize: "0.875rem",
                    fontWeight: "500",
                    cursor: isSaving ? "not-allowed" : "pointer",
                    opacity: isSaving ? 0.6 : 1
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                marginBottom: "0.5rem"
              }}>
                <div style={{ flex: 1 }}>
                  <label style={{ 
                    display: "block", 
                    fontSize: "0.875rem", 
                    fontWeight: "500",
                    color: "#6c757d",
                    marginBottom: "0.5rem"
                  }}>
                    Hardcover Account
                  </label>
                  {isLinked && hardcoverUser ? (
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "0.75rem"
                    }}>
                      {hardcoverUser.cachedImageUrl && (
                        <img
                          src={hardcoverUser.cachedImageUrl}
                          alt="Hardcover avatar"
                          style={{
                            width: "40px",
                            height: "40px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "2px solid #28a745"
                          }}
                          onError={(e) => {
                            // Hide image if it fails to load
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div>
                        <div style={{ 
                          fontSize: "0.875rem", 
                          color: "#28a745",
                          fontWeight: "500",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          marginBottom: "0.25rem"
                        }}>
                          <span style={{ 
                            display: "inline-block",
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "#28a745"
                          }}></span>
                          Linked
                        </div>
                        <div style={{ 
                          fontSize: "0.75rem", 
                          color: "#6c757d"
                        }}>
                          @{hardcoverUser.username}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ 
                      fontSize: "0.875rem", 
                      color: "#6c757d",
                      fontWeight: "500"
                    }}>
                      Not linked
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => setIsEditingToken(true)}
                    style={{
                      backgroundColor: isLinked ? "transparent" : "#00356B",
                      color: isLinked ? "#00356B" : "white",
                      border: `1px solid ${isLinked ? "#00356B" : "transparent"}`,
                      borderRadius: "4px",
                      padding: "0.5rem 1rem",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      if (isLinked) {
                        e.currentTarget.style.backgroundColor = "#f8f9fa";
                      } else {
                        e.currentTarget.style.backgroundColor = "#002a52";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isLinked) {
                        e.currentTarget.style.backgroundColor = "transparent";
                      } else {
                        e.currentTarget.style.backgroundColor = "#00356B";
                      }
                    }}
                  >
                    {isLinked ? "Edit" : "Link Account"}
                  </button>
                  {isLinked && (
                    <button
                      onClick={handleRemoveToken}
                      disabled={isSaving}
                      style={{
                        backgroundColor: "transparent",
                        color: "#dc3545",
                        border: "1px solid #dc3545",
                        borderRadius: "4px",
                        padding: "0.5rem 1rem",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        cursor: isSaving ? "not-allowed" : "pointer",
                        opacity: isSaving ? 0.6 : 1,
                        transition: "background-color 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        if (!isSaving) {
                          e.currentTarget.style.backgroundColor = "#dc3545";
                          e.currentTarget.style.color = "white";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSaving) {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "#dc3545";
                        }
                      }}
                    >
                      Unlink
                    </button>
                  )}
                </div>
              </div>
              {!isLinked && (
                <div style={{ 
                  fontSize: "0.75rem", 
                  color: "#6c757d",
                  marginTop: "0.5rem"
                }}>
                  <a 
                    href="https://hardcover.app/settings/api" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: "#00356B", textDecoration: "underline" }}
                  >
                    Learn how to get your API token →
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountInfo;
