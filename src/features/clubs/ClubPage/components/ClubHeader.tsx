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
        
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: 'bold', 
          marginBottom: '1rem',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          {club.name}
        </h1>
        
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
