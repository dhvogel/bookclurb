import React from 'react';
import { Club } from '../../../../types';

interface OverviewTabProps {
  club: Club;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ club }) => {
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
              </div>
            </div>
            
            {/* Reading Progress Tracker - Full Width */}
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <span style={{ fontSize: '1rem', fontWeight: '600', color: '#333' }}>
                  Reading Progress
                </span>
                <span style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  79%
                </span>
              </div>
              
              {/* Progress Bar Container - allows circle to overflow */}
              <div style={{ 
                position: 'relative',
                padding: '4px 0',
                marginBottom: '0.75rem'
              }}>
                {/* Progress Bar - Redesigned */}
                <div style={{
                  width: '100%',
                  height: '12px',
                  backgroundColor: '#f0f0f5',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
                }}>
                  {/* Completed chapters (1-19) */}
                  <div style={{
                    width: '79.17%', // 19/24 = 79.17%
                    height: '100%',
                    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
                    backgroundSize: '200% 100%',
                    borderRadius: '20px 0 0 20px',
                    transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    boxShadow: '0 0 20px rgba(102, 126, 234, 0.4)',
                    animation: 'shimmer 3s ease-in-out infinite'
                  }} />
                  
                  {/* Not started chapters */}
                  <div style={{
                    position: 'absolute',
                    left: '79.17%',
                    width: '20.83%', // 5 chapters (20-24) = 20.83%
                    height: '100%',
                    background: 'linear-gradient(90deg, rgba(255,107,107,0.3) 0%, rgba(255,142,142,0.4) 100%)',
                    borderRadius: '0 20px 20px 0',
                    borderLeft: '1px solid rgba(255,107,107,0.2)'
                  }} />
                </div>
                
                {/* Progress Indicator - Glowing dot at current position - positioned outside the bar */}
                <div style={{
                  position: 'absolute',
                  left: '79.17%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#764ba2',
                  borderRadius: '50%',
                  boxShadow: '0 0 0 3px white, 0 0 0 5px rgba(118, 75, 162, 0.3), 0 2px 8px rgba(118, 75, 162, 0.4)',
                  zIndex: 10,
                  border: '2px solid white'
                }} />
              </div>
              
              {/* Chapter Info */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.85rem',
                color: '#666',
                padding: '0 0.25rem'
              }}>
                <span style={{ fontWeight: '500', color: '#764ba2' }}>
                  Chapter 20
                </span>
                <span style={{ color: '#999' }}>
                  of 24 chapters
                </span>
              </div>
            </div>
            
            <style>{`
              @keyframes shimmer {
                0%, 100% {
                  background-position: 0% 50%;
                }
                50% {
                  background-position: 100% 50%;
                }
              }
            `}</style>
          </div>
        )}
    </div>
  );
};

export default OverviewTab;
