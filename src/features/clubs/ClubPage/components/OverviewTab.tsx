import React from 'react';
import { Club } from '../../../../types';
import ClubStats from './Sidebar/ClubStats';
import QuickActions from './Sidebar/QuickActions';

interface OverviewTabProps {
  club: Club;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ club }) => {
  const formatTimestamp = (timestamp: string) => {
    return timestamp;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'discussion': return '💬';
      case 'meeting': return '📅';
      case 'book_change': return '📚';
      case 'member_join': return '👋';
      default: return '📝';
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
      {/* Main Content */}
      <div>
        {/* Current Book */}
        {club.currentBook && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#333' }}>
              Current Book
            </h3>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              {club.currentBook.coverUrl && (
                <img
                  src={club.currentBook.coverUrl}
                  alt={club.currentBook.title}
                  style={{
                    width: '120px',
                    height: '180px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#333' }}>
                  {club.currentBook.title}
                </h4>
                {club.currentBook.author && (
                  <p style={{ color: '#666', marginBottom: '1rem' }}>
                    by {club.currentBook.author}
                  </p>
                )}
                <div style={{ 
                  background: '#f8f9fa', 
                  padding: '1rem', 
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  color: '#666'
                }}>
                  📖 Currently reading • Discussion starts soon
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Next Meeting */}
        {club.nextMeeting && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#333' }}>
              Next Meeting
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '1rem',
                borderRadius: '12px',
                textAlign: 'center',
                minWidth: '80px'
              }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                  {new Date(club.nextMeeting.timestamp).toLocaleDateString('en-US', { day: 'numeric' })}
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                  {new Date(club.nextMeeting.timestamp).toLocaleDateString('en-US', { month: 'short' })}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#333' }}>
                  {new Date(club.nextMeeting.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </div>
                {club.nextMeeting.location && (
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>
                    📍 {club.nextMeeting.location}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {club.recentActivity && club.recentActivity.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#333' }}>
              Recent Activity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {club.recentActivity.slice(0, 3).map((activity) => (
                <div key={activity.id} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '1rem',
                  background: '#f8f9fa',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '1.5rem' }}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: '#333', marginBottom: '0.25rem' }}>
                      {activity.title}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                      by {activity.author} • {formatTimestamp(activity.timestamp)}
                    </div>
                    {activity.content && (
                      <div style={{ fontSize: '0.9rem', color: '#555' }}>
                        {activity.content}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div>
        <ClubStats club={club} />
        <QuickActions />
      </div>
    </div>
  );
};

export default OverviewTab;
