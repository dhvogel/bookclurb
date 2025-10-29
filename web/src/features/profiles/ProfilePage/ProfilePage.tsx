import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { Database } from 'firebase/database';
import { getAuth, signOut } from 'firebase/auth';
import { ref, get, update } from 'firebase/database';
import HeaderBar from '../../../components/HeaderBar';
import { useProfileData } from './useProfileData';
import AccountInfo from './components/AccountInfo';
import MyClubs from './components/MyClubs';
import LeaveClubModal from './components/LeaveClubModal';

interface ProfilePageProps {
  user: User | null;
  db: Database;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, db }) => {
  const navigate = useNavigate();
  const { clubs, clubsLoading } = useProfileData({ user, db });
  const [clubToLeave, setClubToLeave] = useState<{ id: string; name: string } | null>(null);
  const [leavingClub, setLeavingClub] = useState(false);
  const [openSettingsMenu, setOpenSettingsMenu] = useState<string | null>(null);

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
              <AccountInfo user={user} />
              
              <MyClubs
                clubs={clubs}
                clubsLoading={clubsLoading}
                onClubClick={handleClubClick}
                onLeaveClubClick={handleLeaveClubClick}
                onSettingsClick={handleSettingsClick}
                openSettingsMenu={openSettingsMenu}
              />

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

      <LeaveClubModal
        clubToLeave={clubToLeave}
        leavingClub={leavingClub}
        onConfirm={handleLeaveClubConfirm}
        onCancel={handleLeaveClubCancel}
      />
    </div>
  );
};

export default ProfilePage;

