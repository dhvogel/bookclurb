import React from 'react';
import { Club } from '../../../../types';

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
                  color: '#666',
                  marginBottom: '1rem'
                }}>
                  📖 Currently reading • Discussion starts soon
                </div>
              </div>
            </div>
            
            {/* Reading Progress Tracker - Full Width */}
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333' }}>
                  Reading Progress
                </span>
              </div>
              
              {/* Progress Bar - Full Width */}
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#e9ecef',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '0.5rem',
                position: 'relative'
              }}>
                {/* Completed chapters (1-19) */}
                <div style={{
                  width: '79.17%', // 19/24 = 79.17%
                  height: '100%',
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '4px 0 0 4px',
                  transition: 'width 0.3s ease',
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  zIndex: 1
                }} />
                {/* Not started (after chapter 24) */}
                <div style={{
                  width: '100%', // covers the whole bar
                  height: '100%',
                  background: '#f2f2f2',
                  borderRadius: '4px',
                  position: 'absolute',
                  left: '100%',
                  top: 0,
                  zIndex: 0
                }} />
                
                {/* Current week chapters (20-24) - highlighted section */}
                <div style={{
                  position: 'absolute',
                  left: '79.17%', // Start at chapter 20
                  width: '20.83%', // 5 chapters (20-24) = 20.83%
                  height: '100%',
                  background: 'repeating-linear-gradient(45deg, yellow, #ff6b6b 2px, #ff8e8e 2px, #ff8e8e 4px)',
                  borderRadius: '0 4px 4px 0',
                  boxShadow: '0 0 0 1px #ff6b6b',
                  animation: 'pulse 2s infinite'
                }} />
              </div>
              
              {/* Chapter Numbers */}
              <div style={{
                position: 'relative',
                marginTop: '0.25rem'
              }}>
                {/* Current chapter number (20) at progress position */}
                <div style={{
                  position: 'absolute',
                  left: '79.17%', // Position at current progress
                  transform: 'translateX(-50%)',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  color: '#333',
                  backgroundColor: 'white',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  zIndex: 2
                }}>
                  Chapter 20
                </div>
                
                {/* Total chapters number (24) at end of bar */}
                <div style={{
                  position: 'absolute',
                  right: '0',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  color: '#666',
                  backgroundColor: 'white',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  zIndex: 2
                }}>
                  24
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
                  {new Date(club.nextMeeting.timestamp).toLocaleDateString('en-US', { day: 'numeric', timeZone: club.nextMeeting.timeZone })}
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                  {new Date(club.nextMeeting.timestamp).toLocaleDateString('en-US', { month: 'short', timeZone: club.nextMeeting.timeZone })}
                </div>
              </div>
              {/* TODO: Add to calendar */}
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#333' }}>
                  {new Date(club.nextMeeting.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: club.nextMeeting.timeZone })}
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
  );
};

export default OverviewTab;
