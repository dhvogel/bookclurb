import React, { useState, useEffect } from "react";
import HeaderBar from "./HeaderBar";
import { User, getAuth, createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { Database, ref, get, update } from "firebase/database";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getInviteServiceURL } from "../config/runtimeConfig";

interface SignupProps {
  user: User | null;
  db: Database;
}

interface InviteValidationResponse {
  valid: boolean;
  message?: string;
  clubId?: string;
  clubName?: string;
  inviterName?: string;
  email?: string;
}

const Signup: React.FC<SignupProps> = ({ user, db }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = getAuth();
  
  const inviteId = searchParams.get("inviteId");
  const clubId = searchParams.get("clubId");
  const inviteEmail = searchParams.get("email");
  
  const [validating, setValidating] = useState(true);
  const [inviteValid, setInviteValid] = useState(false);
  const [inviteData, setInviteData] = useState<InviteValidationResponse | null>(null);
  const [error, setError] = useState<string>("");
  
  const [email, setEmail] = useState(inviteEmail || "");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validate invite on mount (only if inviteId is present)
  useEffect(() => {
    // If no inviteId, skip validation and show the "not accepting signups" page
    if (!inviteId) {
      setValidating(false);
      setInviteValid(false);
      return;
    }

    const validateInvite = async () => {
      if (!clubId) {
        setValidating(false);
        setError("Invalid invite link. Missing club ID.");
        setInviteValid(false);
        return;
      }

      try {
        const inviteServiceURL = getInviteServiceURL();
        const response = await fetch(`${inviteServiceURL}/ValidateInvite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inviteId: inviteId,
            clubId: clubId
          })
        });

        if (!response.ok) {
          throw new Error('Failed to validate invite');
        }

        const data: InviteValidationResponse = await response.json();
        setInviteValid(data.valid);
        setInviteData(data);
        
        if (!data.valid) {
          setError(data.message || "This invite link is not valid or has expired.");
        } else if (data.email && inviteEmail) {
          // Ensure email matches if provided in URL
          if (data.email.toLowerCase() !== inviteEmail.toLowerCase()) {
            setError("The email in the invite link does not match the invite record.");
            setInviteValid(false);
          }
        }
      } catch (err: any) {
        console.error('Error validating invite:', err);
        setError("Failed to validate invite. Please check your link and try again.");
        setInviteValid(false);
      } finally {
        setValidating(false);
      }
    };

    validateInvite();
  }, [inviteId, clubId, inviteEmail]);

  const handleUserCreated = async (newUser: User, displayNameValue?: string) => {
    if (!inviteValid || !inviteData?.clubId || !inviteId) {
      setError("Invalid invite. Cannot proceed with signup.");
      return;
    }

    // Update display name if provided (and not already set from Google)
    if (displayNameValue && displayNameValue.trim() && !newUser.displayName) {
      await updateProfile(newUser, {
        displayName: displayNameValue.trim()
      });
    }

    // Add user to club
    const clubRef = ref(db, `clubs/${inviteData.clubId}`);
    const clubSnapshot = await get(clubRef);
    const clubData = clubSnapshot.val() || {};

    const members = clubData.members || [];
    const userMember = {
      id: newUser.uid,
      name: displayNameValue?.trim() || newUser.displayName || newUser.email || 'New Member',
      img: newUser.photoURL || '',
      role: 'member',
      joinedAt: new Date().toISOString()
    };

    // Check if user is already a member (shouldn't happen, but safety check)
    if (!members.some((m: any) => m.id === newUser.uid)) {
      members.push(userMember);
      await update(clubRef, {
        members: members,
        memberCount: members.length
      });
    }

    // Add club to user's clubs array
    const userRef = ref(db, `users/${newUser.uid}`);
    const userSnapshot = await get(userRef);
    const userData = userSnapshot.val() || {};
    const userClubs = userData.clubs || [];

    if (!userClubs.includes(inviteData.clubId)) {
      userClubs.push(inviteData.clubId);
    }

    // Set user profile data
    const finalDisplayName = displayNameValue?.trim() || newUser.displayName || '';
    const nameParts = finalDisplayName.split(' ');
    const updates: any = {
      clubs: userClubs,
      first_name: nameParts[0] || newUser.email?.split('@')[0] || 'User',
    };

    if (nameParts.length > 1) {
      updates.last_name = nameParts.slice(1).join(' ');
    }

    await update(userRef, updates);

    // Mark invite as accepted
    const inviteRef = ref(db, `club_invites/${inviteData.clubId}/${inviteId}`);
    await update(inviteRef, {
      status: 'accepted',
      acceptedAt: Date.now(),
      acceptedBy: newUser.uid
    });

    // Navigate to the club page
    navigate(`/clubs/${inviteData.clubId}`);
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsLoading(true);

    if (!inviteValid || !inviteData?.clubId || !inviteId) {
      setError("Invalid invite. Cannot proceed with signup.");
      setIsLoading(false);
      return;
    }

    // Check if email matches invite (if invite has an email restriction)
    if (inviteData.email && email && email.trim()) {
      if (inviteData.email.toLowerCase() !== email.trim().toLowerCase()) {
        setError("The email in the invite link does not match. Please use the email address from your invite.");
        setIsLoading(false);
        return;
      }
    }

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const newUser = result.user;

      // If invite has email restriction, verify it matches
      if (inviteData.email && newUser.email?.toLowerCase() !== inviteData.email.toLowerCase()) {
        setError("The email address from your Google account does not match the invite email.");
        setIsLoading(false);
        return;
      }

      await handleUserCreated(newUser);
    } catch (err: any) {
      console.error('Google signup error:', err);
      if (err.code === 'auth/account-exists-with-different-credential') {
        setError("An account with this email already exists. Please sign in instead.");
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError("Sign-in was cancelled.");
      } else if (err.code === 'auth/operation-not-allowed') {
        setError("Google Sign-In is not enabled. Please use email/password to sign up.");
      } else {
        setError(err.message || "Failed to sign in with Google. Please try again.");
      }
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!inviteValid || !inviteData?.clubId || !inviteId) {
      setError("Invalid invite. Cannot proceed with signup.");
      setIsLoading(false);
      return;
    }

    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const newUser = userCredential.user;

      await handleUserCreated(newUser, displayName);
    } catch (err: any) {
      console.error('Signup error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError("An account with this email already exists. Please sign in instead.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password is too weak. Please use at least 6 characters.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Invalid email address.");
      } else {
        setError(err.message || "Failed to create account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if already logged in
  if (user) {
    navigate("/profile");
    return null;
  }

  return (
    <>
      <HeaderBar user={user} db={db} />
      <div className="login-container">
        <div className="login-card">
          {!inviteId ? (
            <>
              <div className="login-header">
                <h1 className="login-title">Join Book Clurb</h1>
                <p className="login-subtitle">We're not accepting new signups yet</p>
              </div>
              
              <div style={{
                textAlign: "center",
                padding: "3rem 1rem",
                color: "#6b7280"
              }}>
                <div style={{
                  fontSize: "4rem",
                  marginBottom: "1.5rem",
                  opacity: 0.6
                }}>
                  🚧
                </div>
                <h3 style={{ 
                  margin: "0 0 1rem 0", 
                  fontSize: "1.5rem",
                  color: "#374151",
                  fontWeight: "600"
                }}>
                  Coming Soon
                </h3>
                <p style={{ 
                  margin: "0 0 1.5rem 0",
                  fontSize: "1.1rem",
                  lineHeight: "1.6"
                }}>
                  We're working hard to bring you the best book club experience. 
                  New signups will be available soon!
                </p>
                <div style={{
                  backgroundColor: "#f3f4f6",
                  borderRadius: "12px",
                  padding: "1.5rem",
                  margin: "2rem 0",
                  border: "1px solid #e5e7eb"
                }}>
                  <h4 style={{
                    margin: "0 0 0.75rem 0",
                    fontSize: "1.1rem",
                    color: "#374151",
                    fontWeight: "600"
                  }}>
                    Stay Updated
                  </h4>
                  <p style={{
                    margin: "0 0 1rem 0",
                    fontSize: "0.95rem",
                    color: "#6b7280"
                  }}>
                    Check back regularly or contact us to be notified when signups open.
                  </p>
                  <p style={{
                    margin: "0",
                    fontSize: "0.95rem",
                    color: "#6b7280"
                  }}>
                    Have questions? Visit our{" "}
                    <a 
                      href="https://github.com/dhvogel/bookclurb" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        color: "#00356B", 
                        textDecoration: "none",
                        fontWeight: "500"
                      }}
                    >
                      GitHub repository
                    </a>{" "}
                    for more information.
                  </p>
                </div>
              </div>

              <div className="login-footer">
                <p className="footer-text">
                  Already have an account? 
                  <a href="/login" className="footer-link"> Sign in here</a>
                </p>
              </div>
            </>
          ) : validating ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <div className="spinner" style={{ margin: "0 auto 1rem" }}>
                <svg viewBox="0 0 24 24" style={{ width: "48px", height: "48px" }}>
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="31.416" strokeDashoffset="31.416">
                    <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                    <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                  </circle>
                </svg>
              </div>
              <p style={{ color: "#6b7280", fontSize: "1.1rem" }}>Validating invite...</p>
            </div>
          ) : !inviteValid ? (
            <>
              <div className="login-header">
                <h1 className="login-title">Invalid Invite</h1>
                <p className="login-subtitle">This invite link is not valid</p>
              </div>
              
              <div style={{
                textAlign: "center",
                padding: "2rem 1rem",
                color: "#6b7280"
              }}>
                <div style={{
                  fontSize: "3rem",
                  marginBottom: "1rem",
                  opacity: 0.6
                }}>
                  ❌
                </div>
                <p style={{ 
                  margin: "0 0 1.5rem 0",
                  fontSize: "1rem",
                  lineHeight: "1.6",
                  color: "#dc2626"
                }}>
                  {error || "This invite link is not valid or has expired."}
                </p>
                <div style={{
                  backgroundColor: "#f3f4f6",
                  borderRadius: "12px",
                  padding: "1.5rem",
                  margin: "1rem 0",
                  border: "1px solid #e5e7eb"
                }}>
                  <p style={{
                    margin: "0 0 1rem 0",
                    fontSize: "0.95rem",
                    color: "#6b7280"
                  }}>
                    Please contact the person who invited you for a new invite link.
                  </p>
                </div>
              </div>

              <div className="login-footer">
                <p className="footer-text">
                  Already have an account? 
                  <a href="/login" className="footer-link"> Sign in here</a>
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="login-header">
                <h1 className="login-title">Join {inviteData?.clubName || "Book Clurb"}</h1>
                <p className="login-subtitle">
                  {inviteData?.inviterName && `You've been invited by ${inviteData.inviterName}`}
                </p>
              </div>
              
              <form onSubmit={handleSubmit} className="login-form">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="google-signin-button"
                  disabled={isLoading}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                    <path fill="#FBBC05" d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.712s.102-1.172.282-1.712V4.956H.957C.348 6.174 0 7.55 0 9s.348 2.826.957 4.044l3.007-2.332z"/>
                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.956L3.964 7.288C4.672 5.163 6.656 3.58 9 3.58z"/>
                  </svg>
                  {isLoading ? 'Signing in...' : 'Sign up with Google'}
                </button>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: '1.5rem 0',
                  gap: '0.75rem'
                }}>
                  <div style={{
                    flex: 1,
                    height: '1px',
                    backgroundColor: '#e5e7eb'
                  }}></div>
                  <span style={{
                    color: '#6b7280',
                    fontSize: '0.875rem'
                  }}>or</span>
                  <div style={{
                    flex: 1,
                    height: '1px',
                    backgroundColor: '#e5e7eb'
                  }}></div>
                </div>

                <div className="form-group">
                  <label htmlFor="displayName" className="form-label">Full Name</label>
                  <div className="input-wrapper">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <input
                      id="displayName"
                      type="text"
                      placeholder="Enter your full name"
                      value={displayName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">Email Address</label>
                  <div className="input-wrapper">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                      className="form-input"
                      required
                      disabled={!!inviteEmail}
                      style={inviteEmail ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
                    />
                  </div>
                  {inviteEmail && (
                    <p style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "0.5rem" }}>
                      Email is pre-filled from invite
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">Password</label>
                  <div className="input-wrapper">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <circle cx="12" cy="16" r="1"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password (min. 6 characters)"
                      value={password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                      className="form-input"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="error-message">
                    <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="15" y1="9" x2="9" y2="15"/>
                      <line x1="9" y1="9" x2="15" y2="15"/>
                    </svg>
                    {error}
                  </div>
                )}

                <button 
                  type="submit" 
                  className="login-button"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <svg className="spinner" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="31.416" strokeDashoffset="31.416">
                          <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                          <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                        </circle>
                      </svg>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <svg className="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="8.5" cy="7" r="4"/>
                        <line x1="20" y1="8" x2="20" y2="14"/>
                        <line x1="23" y1="11" x2="17" y2="11"/>
                      </svg>
                      Create Account & Join Club
                    </>
                  )}
                </button>
              </form>

              <div className="login-footer">
                <p className="footer-text">
                  Already have an account? 
                  <a href="/login" className="footer-link"> Sign in here</a>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Signup;
