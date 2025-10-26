import React, { useState } from 'react';
import { Database } from 'firebase/database';
import { useBookVoting } from '../useBookVoting';

interface CreatePollCardProps {
  clubId: string;
  userId: string;
  db: Database;
}

const CreatePollCard: React.FC<CreatePollCardProps> = ({ clubId, userId, db }) => {
  const { createPoll } = useBookVoting({ db, clubId, userId });
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePoll = async () => {
    setIsCreating(true);
    try {
      // Create poll that closes in 7 days
      const closesAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await createPoll(closesAt);
    } catch (error) {
      console.error('Failed to create poll:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      marginBottom: '1rem'
    }}>
      <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#333' }}>
        🗳️ Start New Voting Round
      </h4>
      <p style={{ color: '#666', marginBottom: '1.5rem' }}>
        Create a new poll for members to submit and vote on the next book to read.
      </p>
      <button
        onClick={handleCreatePoll}
        disabled={isCreating}
        style={{
          background: isCreating ? '#e1e5e9' : '#007bff',
          color: isCreating ? '#999' : 'white',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          fontSize: '1rem',
          fontWeight: '500',
          cursor: isCreating ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s'
        }}
        onMouseEnter={(e) => {
          if (!isCreating) {
            e.currentTarget.style.backgroundColor = '#0056b3';
          }
        }}
        onMouseLeave={(e) => {
          if (!isCreating) {
            e.currentTarget.style.backgroundColor = '#007bff';
          }
        }}
      >
        {isCreating ? 'Creating...' : 'Create Poll'}
      </button>
    </div>
  );
};

export default CreatePollCard;
