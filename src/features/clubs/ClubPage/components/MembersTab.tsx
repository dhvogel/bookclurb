import React from 'react';
import { Club } from '../../../../types';

interface MembersTabProps {
  club: Club;
}

const MembersTab: React.FC<MembersTabProps> = ({ club }) => {
  // Book reading data
  const bookData = [
    { title: "Tale of Two Cities", read: ["Charles", "Grant", "Dan", "Alden"] },
    { title: "Grapes of Wrath", read: ["Grant", "Dan", "Alden", "Charles"] },
    { title: "Socialism", read: ["Dan", "Grant", "Alden"] },
    { title: "Bomber Mafia", read: ["Dan", "Grant", "Alden"] },
    { title: "The Secret Agent", read: ["Dan", "Grant", "Dhru"] },
    { title: "Catch-22", read: ["Dan", "Grant", "Dhru", "David"] },
    { title: "Valiant Ambition", read: ["Dan", "Grant", "Dhru", "David"] },
    { title: "Poor Economics", read: ["Dan", "Grant", "Dhru", "David", "Margaret", "Paul"] },
    { 
      title: "The Fourth Turning", 
      read: ["Dan", "Grant", "Dhru", "David"],
      halfCredit: ["David"]
    }
  ];

  const getReadingStatus = (memberName: string, book: any) => {
    if (book.halfCredit && book.halfCredit.includes(memberName)) {
      return 'half';
    }
    return book.read.includes(memberName) ? 'read' : 'not-read';
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
        Club Members ({club.memberCount})
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
                background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.1rem'
              }}>
                {member.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <div style={{ fontWeight: '600', color: '#333' }}>
                  {member.name}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  {member.role === 'admin' ? '👑 Admin' : '👤 Member'}
                </div>
              </div>
            </div>
            
            {/* Book Reading Badges */}
            <div style={{ marginTop: '0.5rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: '600', color: '#666', marginBottom: '0.5rem' }}>
                Books Read:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                {bookData.map((book) => {
                  const status = getReadingStatus(member.name, book);
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
