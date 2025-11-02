import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, ref, push, set, get, update } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'firebase/auth';

interface CreateClubModalProps {
  show: boolean;
  onClose: () => void;
  user: User;
  db: Database;
}

const CreateClubModal: React.FC<CreateClubModalProps> = ({ show, onClose, user, db }) => {
  const navigate = useNavigate();
  const [newClub, setNewClub] = useState({
    name: '',
    description: '',
    coverColor: '#667eea',
    coverImage: '',
  });
  const [creatingClub, setCreatingClub] = useState(false);

  const handleCreateClub = async () => {
    if (!user || !db || !newClub.name.trim()) {
      alert('Please fill in the club name');
      return;
    }

    setCreatingClub(true);

    try {
      // Generate a new club ID
      const clubsRef = ref(db, 'clubs');
      const newClubRef = push(clubsRef);
      const clubId = newClubRef.key;

      if (!clubId) {
        throw new Error('Failed to generate club ID');
      }

      // Create club data
      const clubData: any = {
        name: newClub.name,
        description: newClub.description || '',
        coverColor: newClub.coverColor,
        memberCount: 1,
        members: [
          {
            id: user.uid,
            name: user.displayName || user.email || 'Admin',
            avatar: user.photoURL || '',
            role: 'admin',
            joinedAt: new Date().toISOString(),
          },
        ],
        booksRead: [],
        recentActivity: [],
      };

      // Add cover image if provided
      if (newClub.coverImage) {
        clubData.coverImage = newClub.coverImage;
      }

      // Create the club in Firebase
      await set(ref(db, `clubs/${clubId}`), clubData);

      // Add club to user's clubs array and ensure user profile exists
      const userRef = ref(db, `users/${user.uid}`);
      const userSnapshot = await get(userRef);
      const userData = userSnapshot.val() || {};
      const userClubs = userData.clubs || [];
      
      if (!userClubs.includes(clubId)) {
        userClubs.push(clubId);
      }

      // Update user with clubs array and name fields if not already set
      const updates: any = { clubs: userClubs };
      
      if (!userData.first_name) {
        // Extract first name from displayName or email
        const displayName = user.displayName || '';
        const email = user.email || '';
        updates.first_name = displayName ? displayName.split(' ')[0] : (email.split('@')[0] || 'User');
      }
      
      if (!userData.last_name && user.displayName) {
        const nameParts = user.displayName.split(' ');
        if (nameParts.length > 1) {
          updates.last_name = nameParts.slice(1).join(' ');
        }
      }

      await update(userRef, updates);

      // Reset form and close modal
      setNewClub({ name: '', description: '', coverColor: '#667eea', coverImage: '' });
      onClose();

      // Navigate to the new club
      navigate(`/clubs/${clubId}`);
    } catch (error) {
      console.error('Error creating club:', error);
      alert('Failed to create club. Please try again.');
    } finally {
      setCreatingClub(false);
    }
  };

  const handleCancel = () => {
    setNewClub({ name: '', description: '', coverColor: '#667eea', coverImage: '' });
    onClose();
  };

  return (
    <AnimatePresence>
      {show && (
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
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              minWidth: '500px',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              marginBottom: '1.5rem',
              color: '#333'
            }}>
              Create New Club
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '600',
                  color: '#333',
                  fontSize: '0.95rem'
                }}>
                  Club Name *
                </label>
                <input
                  type="text"
                  value={newClub.name}
                  onChange={(e) => setNewClub({ ...newClub, name: e.target.value })}
                  placeholder="Enter club name"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '600',
                  color: '#333',
                  fontSize: '0.95rem'
                }}>
                  Description
                </label>
                <textarea
                  value={newClub.description}
                  onChange={(e) => setNewClub({ ...newClub, description: e.target.value })}
                  placeholder="What's this club about?"
                  rows={4}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '600',
                  color: '#333',
                  fontSize: '0.95rem'
                }}>
                  Cover Color
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input
                    type="color"
                    value={newClub.coverColor}
                    onChange={(e) => setNewClub({ ...newClub, coverColor: e.target.value })}
                    style={{
                      width: '80px',
                      height: '40px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  />
                  <input
                    type="text"
                    value={newClub.coverColor}
                    onChange={(e) => setNewClub({ ...newClub, coverColor: e.target.value })}
                    placeholder="#667eea"
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      fontSize: '1rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                  />
                </div>
              </div>

              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  fontWeight: '600',
                  color: '#333',
                  fontSize: '0.95rem'
                }}>
                  Cover Image URL (optional)
                </label>
                <input
                  type="text"
                  value={newClub.coverImage}
                  onChange={(e) => setNewClub({ ...newClub, coverImage: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                />
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              marginTop: '2rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={handleCancel}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  background: '#f0f0f0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e0e0e0'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f0f0f0'}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateClub}
                disabled={creatingClub || !newClub.name.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  background: creatingClub || !newClub.name.trim() 
                    ? '#ccc' 
                    : 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: creatingClub || !newClub.name.trim() ? 'not-allowed' : 'pointer',
                  transition: 'transform 0.2s ease',
                  opacity: creatingClub || !newClub.name.trim() ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!creatingClub && newClub.name.trim()) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {creatingClub ? 'Creating...' : 'Create Club'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateClubModal;

