import React from 'react';

const DiscussionsTab: React.FC = () => {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '2rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#333' }}>
        Club Discussions
      </h3>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Join the conversation and share your thoughts on our current book.
      </p>
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
        <h4 style={{ color: '#333', marginBottom: '0.5rem' }}>No discussions yet</h4>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          Be the first to start a discussion about the current book!
        </p>
        <button style={{
          padding: '1rem 2rem',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
        }}>
          Start First Discussion
        </button>
      </div>
    </div>
  );
};

export default DiscussionsTab;
