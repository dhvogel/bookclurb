import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { Database, ref, update, remove, get } from 'firebase/database';
import { Club } from '../../../../types';

interface SettingsTabProps {
  club: Club;
  user: User | null;
  db: Database;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ club, user, db }) => {
  const navigate = useNavigate();
  
  // Check if current user is an admin
  const isAdmin = user && club.members?.some(
    member => member.id === user.uid && member.role === 'admin'
  );

  // Form state
  const [clubName, setClubName] = useState(club.name || '');
  const [description, setDescription] = useState(club.description || '');
  const [coverColor, setCoverColor] = useState(club.coverColor || '#667eea');
  const [isPublic, setIsPublic] = useState(club.isPublic ?? false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Member role management state
  const [changingRoles, setChangingRoles] = useState<Record<string, boolean>>({});
  
  // Delete club state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingClub, setDeletingClub] = useState(false);

  // Reset form when club data changes
  useEffect(() => {
    setClubName(club.name || '');
    setDescription(club.description || '');
    setCoverColor(club.coverColor || '#667eea');
    setIsPublic(club.isPublic ?? false);
  }, [club]);

  // If not admin, show access denied message
  if (!isAdmin) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#333' }}>
          Access Denied
        </h3>
        <p style={{ color: '#666' }}>
          You need administrator privileges to access club settings.
        </p>
      </div>
    );
  }

  const handleSaveBasicInfo = async () => {
    if (!clubName.trim()) {
      setMessage({ type: 'error', text: 'Club name is required' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const clubRef = ref(db, `clubs/${club.id}`);
      const updates: any = {
        name: clubName.trim()
      };

      if (description.trim()) {
        updates.description = description.trim();
      } else {
        updates.description = '';
      }

      if (coverColor) {
        updates.coverColor = coverColor;
      }

      updates.isPublic = isPublic;

      await update(clubRef, updates);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };


  const handleRoleChange = async (memberId: string, newRole: 'admin' | 'member') => {
    if (!club.members) return;

    // Prevent removing the last admin
    const currentAdmins = club.members.filter(m => m.role === 'admin');
    const memberToChange = club.members.find(m => m.id === memberId);
    
    if (memberToChange?.role === 'admin' && currentAdmins.length === 1 && newRole === 'member') {
      setMessage({ type: 'error', text: 'Cannot remove the last admin from the club.' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setChangingRoles(prev => ({ ...prev, [memberId]: true }));
    setMessage(null);

    try {
      const clubRef = ref(db, `clubs/${club.id}`);
      const updatedMembers = club.members.map(member => 
        member.id === memberId 
          ? { ...member, role: newRole }
          : member
      );

      await update(clubRef, { members: updatedMembers });
      setMessage({ type: 'success', text: `Member role updated to ${newRole}` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to update member role:', error);
      setMessage({ type: 'error', text: 'Failed to update member role. Please try again.' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setChangingRoles(prev => ({ ...prev, [memberId]: false }));
    }
  };

  const handleDeleteClub = async () => {
    if (!user || !club.members) return;

    setDeletingClub(true);
    setMessage(null);

    try {
      // Remove club ID from all members' clubs arrays
      const memberPromises = club.members.map(async (member) => {
        if (!member.id) return;
        
        const userRef = ref(db, `users/${member.id}`);
        const userSnapshot = await get(userRef);
        const userData = userSnapshot.val() || {};
        const userClubs = userData.clubs || [];
        
        const updatedClubs = userClubs.filter((id: string) => id !== club.id);
        await update(userRef, { clubs: updatedClubs });
      });

      await Promise.all(memberPromises);

      // Delete the club itself
      const clubRef = ref(db, `clubs/${club.id}`);
      await remove(clubRef);

      // Navigate back to clubs list
      navigate('/clubs');
    } catch (error) {
      console.error('Failed to delete club:', error);
      setMessage({ type: 'error', text: 'Failed to delete club. Please try again.' });
      setDeletingClub(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div>
      {/* Success/Error Message */}
      {message && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '1rem',
          borderRadius: '8px',
          background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
          color: message.type === 'success' ? '#10b981' : '#dc2626',
          border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          fontSize: '0.95rem',
          fontWeight: '500'
        }}>
          {message.text}
        </div>
      )}

      {/* Basic Club Settings */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          marginBottom: '1.5rem', 
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>⚙️</span>
          <span>Basic Club Settings</span>
        </h3>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '0.95rem', 
            fontWeight: '600', 
            color: '#333',
            marginBottom: '0.5rem'
          }}>
            Club Name *
          </label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="text"
              value={clubName}
              onChange={(e) => setClubName(e.target.value)}
              placeholder="Enter club name"
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '0.95rem', 
            fontWeight: '600', 
            color: '#333',
            marginBottom: '0.5rem'
          }}>
            Description
          </label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your book club..."
              rows={4}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '0.95rem', 
            fontWeight: '600', 
            color: '#333',
            marginBottom: '0.5rem'
          }}>
            Cover Color
          </label>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="color"
              value={coverColor}
              onChange={(e) => setCoverColor(e.target.value)}
              style={{
                width: '80px',
                height: '50px',
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                cursor: 'pointer',
                outline: 'none'
              }}
            />
            <input
              type="text"
              value={coverColor}
              onChange={(e) => setCoverColor(e.target.value)}
              placeholder="#667eea"
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                fontFamily: 'monospace'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
            />
          </div>
          <p style={{ 
            fontSize: '0.85rem', 
            color: '#666', 
            marginTop: '0.5rem',
            marginBottom: 0
          }}>
            This color is used for the club's header and branding
          </p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            padding: '1rem',
            background: '#f8f9fa',
            borderRadius: '8px',
            border: '2px solid #e1e5e9'
          }}>
            <div style={{ flex: 1 }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.95rem', 
                fontWeight: '600', 
                color: '#333',
                marginBottom: '0.25rem'
              }}>
                {isPublic ? 'Public Club' : 'Private Club'}
              </label>
              <p style={{ 
                fontSize: '0.85rem', 
                color: '#666',
                margin: 0
              }}>
                {isPublic 
                  ? 'This club is visible on the public clubs page. Anyone can see it.' 
                  : 'This club is private. Only members can see it.'}
              </p>
            </div>
            <label style={{
              position: 'relative',
              display: 'inline-block',
              width: '52px',
              height: '28px',
              marginLeft: '1rem'
            }}>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                style={{
                  opacity: 0,
                  width: 0,
                  height: 0
                }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: isPublic ? '#00356B' : '#ccc',
                transition: '.4s',
                borderRadius: '28px'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '""',
                  height: '22px',
                  width: '22px',
                  left: '3px',
                  bottom: '3px',
                  backgroundColor: 'white',
                  transition: '.4s',
                  borderRadius: '50%',
                  transform: isPublic ? 'translateX(24px)' : 'translateX(0)'
                }} />
              </span>
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSaveBasicInfo}
            disabled={saving}
            style={{
              padding: '0.75rem 2rem',
              background: saving ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.2s',
              opacity: saving ? 0.7 : 1
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.opacity = '0.9';
              }
            }}
            onMouseLeave={(e) => {
              if (!saving) {
                e.currentTarget.style.opacity = '1';
              }
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Member Role Management */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          marginBottom: '1.5rem', 
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>👥</span>
          <span>Member Roles</span>
        </h3>
        <p style={{ 
          color: '#666', 
          marginBottom: '1.5rem',
          fontSize: '0.95rem'
        }}>
          Manage member roles. Admins can configure club settings and manage members.
        </p>

        {club.members && club.members.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {club.members.map((member) => (
              <div
                key={member.id}
                style={{
                  padding: '1rem',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  border: member.id === user?.uid ? '2px solid #667eea' : '1px solid #e1e5e9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#e1e5e9'
                  }}>
                    {member.img ? (
                      <img 
                        src={member.img}
                        alt={member.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6b7280',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                      }}>
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', color: '#333', marginBottom: '0.25rem' }}>
                      {member.name}
                      {member.id === user?.uid && (
                        <span style={{ 
                          marginLeft: '0.5rem',
                          fontSize: '0.85rem',
                          color: '#667eea',
                          fontWeight: '500'
                        }}>
                          (You)
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                      {member.role === 'admin' ? 'Administrator' : 'Member'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {member.role === 'admin' ? (
                    <button
                      onClick={() => handleRoleChange(member.id!, 'member')}
                      disabled={changingRoles[member.id!] || member.id === user?.uid}
                      style={{
                        padding: '0.5rem 1rem',
                        background: member.id === user?.uid ? '#e1e5e9' : '#fef2f2',
                        color: member.id === user?.uid ? '#999' : '#dc2626',
                        border: '1px solid',
                        borderColor: member.id === user?.uid ? '#d1d5db' : '#fecaca',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        cursor: member.id === user?.uid ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        opacity: changingRoles[member.id!] ? 0.6 : 1
                      }}
                      title={member.id === user?.uid ? 'Cannot change your own role' : 'Remove admin privileges'}
                    >
                      {changingRoles[member.id!] ? 'Updating...' : 'Make Member'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRoleChange(member.id!, 'admin')}
                      disabled={changingRoles[member.id!]}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#f0fdf4',
                        color: '#10b981',
                        border: '1px solid #bbf7d0',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        cursor: changingRoles[member.id!] ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        opacity: changingRoles[member.id!] ? 0.6 : 1
                      }}
                      title="Grant admin privileges"
                    >
                      {changingRoles[member.id!] ? 'Updating...' : 'Make Admin'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem', 
            color: '#999',
            fontSize: '0.95rem'
          }}>
            No members found
          </div>
        )}
      </div>

      {/* Delete Club */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          marginBottom: '1rem', 
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <span>🗑️</span>
          <span>Delete Club</span>
        </h3>
        <p style={{ 
          color: '#666', 
          marginBottom: '1.5rem',
          fontSize: '0.95rem'
        }}>
          Permanently delete this club and all its data. This action cannot be undone.
        </p>

        <button
          onClick={() => setShowDeleteConfirm(true)}
          style={{
            padding: '0.75rem 2rem',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          Delete Club
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}
        onClick={() => !deletingClub && setShowDeleteConfirm(false)}
        >
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              marginBottom: '1rem', 
              color: '#333'
            }}>
              Delete Club?
            </h3>
            <p style={{ 
              color: '#666', 
              marginBottom: '2rem',
              fontSize: '0.95rem',
              lineHeight: '1.6'
            }}>
              Are you sure you want to delete <strong>"{club.name}"</strong>? This will permanently remove the club and all its data. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deletingClub}
                style={{
                  padding: '0.75rem 2rem',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: deletingClub ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!deletingClub) {
                    e.currentTarget.style.opacity = '0.9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!deletingClub) {
                    e.currentTarget.style.opacity = '1';
                  }
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteClub}
                disabled={deletingClub}
                style={{
                  padding: '0.75rem 2rem',
                  background: deletingClub ? '#ccc' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: deletingClub ? 'not-allowed' : 'pointer',
                  transition: 'opacity 0.2s',
                  opacity: deletingClub ? 0.7 : 1
                }}
              >
                {deletingClub ? 'Deleting...' : 'Delete Club'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsTab;

