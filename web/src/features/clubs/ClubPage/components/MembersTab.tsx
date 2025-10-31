import React, { useState } from 'react';
import { User, getAuth } from 'firebase/auth';
import { Database, ref, push, set } from 'firebase/database';
import { Club } from '../../../../types';
import { getInviteServiceURL } from '../../../../config/runtimeConfig';

interface MembersTabProps {
  club: Club;
  user: User | null;
  db: Database;
}

const MembersTab: React.FC<MembersTabProps> = ({ club, user, db }) => {
  const [email, setEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check if current user is an admin
  const isAdmin = user && club.members?.some(
    member => member.id === user.uid && member.role === 'admin'
  );

  const handleInvite = async () => {
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter an email address' });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }

    if (!user) {
      setMessage({ type: 'error', text: 'You must be logged in to send invites' });
      return;
    }

    setInviting(true);
    setMessage(null);

    try {
      const inviteEmail = email.trim();
      
      // Step 1: Write to Firebase that invite was created
      const inviteRef = ref(db, `club_invites/${club.id}`);
      const newInviteRef = push(inviteRef);
      const inviteId = newInviteRef.key;
      
      if (!inviteId) {
        throw new Error('Failed to create invite record');
      }

      // Write invite creation record
      const inviteData = {
        email: inviteEmail,
        clubId: club.id,
        clubName: club.name,
        invitedBy: user.uid,
        inviterName: user.displayName || user.email || 'A club admin',
        createdAt: Date.now(),
        status: 'pending' // Will be updated to 'sent' by Go service
      };

      await set(newInviteRef, inviteData);

      // Step 2: Call Go service to send email
      const auth = getAuth();
      const idToken = await user.getIdToken();
      
      // Get the invite service URL from runtime config
      const inviteServiceURL = getInviteServiceURL();
      
      const response = await fetch(`${inviteServiceURL}/SendClubInvite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          email: inviteEmail,
          clubId: club.id,
          clubName: club.name,
          inviterName: user.displayName || user.email || 'A club admin',
          inviteId: inviteId // Pass the invite ID so Go service can update it
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: response.statusText 
        }));
        throw new Error(errorData.message || 'Failed to send invite email');
      }

      const result = await response.json();
      setMessage({ type: 'success', text: `Invite sent to ${inviteEmail}` });
      setEmail('');
    } catch (error: any) {
      console.error('Error sending invite:', error);
      const errorMessage = error?.message || 'Failed to send invite. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setInviting(false);
    }
  };
  const getReadingStatus = (book: any) => {
    if (book.halfCredit) {
      return 'half';
    }
    return book.read ? 'read' : 'not-read';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'read':
        return '#10b981';
      case 'half':
        return '#f59e0b';
      case 'not-read':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '2rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#333' }}>
        Club Members ({club.members?.length || 0})
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
        {club.members?.map((member) => (
          <div key={member.id} style={{
            padding: '1rem',
            background: '#f8f9fa',
            borderRadius: '8px',
            transition: 'background 0.2s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <img 
                  src={member.img || `https://api.dicebear.com/7.x/bottts/png?seed=${member.name}&backgroundColor=f8f9fa`}
                  alt={`${member.name}'s profile`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => {
                    // Fallback to initials if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `<div style="
                        width: 100%;
                        height: 100%;
                        background: #f8f9fa;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: #6b7280;
                        font-weight: bold;
                        font-size: 1.1rem;
                      ">${member.name.split(' ').map(n => n[0]).join('')}</div>`;
                    }
                  }}
                />
              </div>
              <div>
                <div style={{ fontWeight: '600', color: '#333' }}>
                  {member.name}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  {member.role === 'admin' ? 'Admin' : 'Member'}
                </div>
              </div>
            </div>
            
            {/* Book Reading Badges */}
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                {member.bookData?.map((book) => {
                  const status = getReadingStatus(book);
                  return (
                    <div
                      key={book.title}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '12px',
                        fontSize: '0.7rem',
                        fontWeight: '500',
                        background: status === 'read' ? '#f0fdf4' : 
                                  status === 'half' ? '#fffbeb' : '#fef2f2',
                        color: getStatusColor(status),
                        border: `1px solid ${status === 'read' ? '#bbf7d0' : 
                                         status === 'half' ? '#fed7aa' : '#fecaca'}`,
                        maxWidth: '120px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {book.title}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Admin-only invite card */}
      {isAdmin && (
        <div style={{
          background: '#f8f9fa',
          borderRadius: '12px',
          padding: '1.5rem',
          marginTop: '1.5rem',
          border: '1px solid #dee2e6',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <h4 style={{ 
            fontSize: '1.2rem', 
            fontWeight: 'bold', 
            marginBottom: '1rem', 
            color: '#333' 
          }}>
            Invite New Member
          </h4>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              disabled={inviting}
              style={{
                flex: '1',
                minWidth: '250px',
                padding: '0.75rem 1rem',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                fontSize: '1rem',
                background: 'white',
                color: '#333',
                outline: 'none'
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleInvite();
                }
              }}
            />
            <button
              onClick={handleInvite}
              disabled={inviting}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: inviting ? 'not-allowed' : 'pointer',
                opacity: inviting ? 0.7 : 1,
                transition: 'opacity 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {inviting ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
          {message && (
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              borderRadius: '6px',
              background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
              color: message.type === 'success' ? '#10b981' : '#dc2626',
              border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
              fontSize: '0.9rem'
            }}>
              {message.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MembersTab;
