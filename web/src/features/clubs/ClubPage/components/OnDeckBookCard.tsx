import React from 'react';
import { Club } from '../../../../types';

interface OnDeckBookCardProps {
  club: Club;
}

const OnDeckBookCard: React.FC<OnDeckBookCardProps> = ({ club }) => {
  if (!club.onDeckBook) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
      border: '2px solid #667eea',
      borderRadius: '12px',
      padding: '2rem',
      marginBottom: '2rem',
      boxShadow: '0 4px 20px rgba(102, 126, 234, 0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <span style={{ fontSize: '1.5rem' }}>📌</span>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333', margin: 0 }}>
          On Deck
        </h3>
      </div>
      <div style={{ display: 'flex', gap: '1.5rem' }}>
        {club.onDeckBook.coverUrl && (
          <img
            src={club.onDeckBook.coverUrl}
            alt={club.onDeckBook.title}
            style={{
              width: '120px',
              height: '180px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              objectFit: 'cover'
            }}
          />
        )}
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#333' }}>
            {club.onDeckBook.title}
          </h4>
          {club.onDeckBook.author && (
            <p style={{ color: '#666', marginBottom: '1rem', fontSize: '1rem' }}>
              by {club.onDeckBook.author}
            </p>
          )}
          <p style={{ 
            color: '#667eea', 
            fontSize: '0.9rem', 
            fontStyle: 'italic',
            margin: 0
          }}>
            Next up for the club!
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnDeckBookCard;
