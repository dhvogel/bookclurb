import React from 'react';

const BooksTab: React.FC = () => {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '2rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#333' }}>
        Book History
      </h3>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Track the books we've read together as a club.
      </p>
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
        <h4 style={{ color: '#333', marginBottom: '0.5rem' }}>No book history yet</h4>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          Our reading journey starts with the current book!
        </p>
      </div>
    </div>
  );
};

export default BooksTab;
