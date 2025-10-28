import React from 'react';
import { Club } from '../../../../types';

interface MembersTabProps {
  club: Club;
}

const MembersTab: React.FC<MembersTabProps> = ({ club }) => {
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
    </div>
  );
};

export default MembersTab;
