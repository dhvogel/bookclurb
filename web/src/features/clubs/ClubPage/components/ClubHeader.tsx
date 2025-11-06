import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Club } from '../../../../types';

interface ClubHeaderProps {
  club: Club;
}

const ClubHeader: React.FC<ClubHeaderProps> = ({ club }) => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        background: club.coverImage 
          ? `url(${club.coverImage}) center/cover`
          : `linear-gradient(135deg, ${club.coverColor} 0%, ${club.coverColor}dd 100%)`,
        color: 'white',
        padding: '3rem 2rem',
        position: 'relative',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <button
          onClick={() => navigate('/clubs')}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer',
            marginBottom: '2rem',
            backdropFilter: 'blur(10px)',
          }}
        >
          ← Back to Clubs
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: 'bold', 
            margin: 0,
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            {club.name}
          </h1>
          
          {/* Public/Private Club Indicator */}
          {club.isPublic === false ? (
            <div 
              title="Private Club"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255,255,255,0.2)',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                backdropFilter: 'blur(10px)',
                fontSize: '0.9rem',
                fontWeight: '500',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>Private Club</span>
            </div>
          ) : club.isPublic === true ? (
            <div 
              title="Public Club"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255,255,255,0.2)',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                backdropFilter: 'blur(10px)',
                fontSize: '0.9rem',
                fontWeight: '500',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>Public Club</span>
            </div>
          ) : null}
        </div>
        
        {club.description && (
          <p style={{ 
            fontSize: '1.2rem', 
            opacity: 0.9,
            maxWidth: '600px',
            lineHeight: 1.6,
            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
          }}>
            {club.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default ClubHeader;
