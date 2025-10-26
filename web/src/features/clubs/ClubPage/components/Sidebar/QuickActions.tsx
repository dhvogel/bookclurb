import React from 'react';

const QuickActions: React.FC = () => {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '2rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#333' }}>
        Quick Actions
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <button style={{
          padding: '0.75rem 1rem',
          border: 'none',
          background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600',
          transition: 'transform 0.2s ease'
        }}>
          💬 Start Discussion
        </button>
        <button style={{
          padding: '0.75rem 1rem',
          border: '2px solid #667eea',
          background: 'transparent',
          color: '#667eea',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600',
          transition: 'all 0.2s ease'
        }}>
          📅 Schedule Meeting
        </button>
        <button style={{
          padding: '0.75rem 1rem',
          border: '2px solid #28a745',
          background: 'transparent',
          color: '#28a745',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: '600',
          transition: 'all 0.2s ease'
        }}>
          📚 Suggest Book
        </button>
      </div>
    </div>
  );
};

export default QuickActions;
