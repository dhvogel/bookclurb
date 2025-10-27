import React, { useState, useEffect } from 'react';
import { BookSubmission, Vote, Club } from '../../../../types';

interface VotingCardProps {
  pollId: string;
  userId: string;
  submissions: BookSubmission[];
  onVote: (vote: Omit<Vote, 'id' | 'submittedAt'>) => void;
  existingVote?: Vote;
  pollClosesAt: string;
  club?: Club;
}

const VotingCard: React.FC<VotingCardProps> = ({
  pollId,
  userId,
  submissions,
  onVote,
  existingVote,
  pollClosesAt,
  club
}) => {
  // Helper function to get member name from userId
  const getUserName = (userIdToLookup: string): string => {
    if (!club?.members || !Array.isArray(club.members)) {
      return 'Unknown Member';
    }
    
    const validMembers = club.members.filter(member => member && member.id);
    const member = validMembers.find(m => m.id === userIdToLookup);
    
    if (!member) {
      return 'Unknown Member';
    }
    
    return member.name || 'Unknown Member';
  };
  const [rankings, setRankings] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState('');

  // Load rankings from existing vote whenever it changes
  useEffect(() => {
    if (existingVote) {
      setRankings(existingVote.rankings);
    } else {
      setRankings([]);
    }
  }, [existingVote]);

  useEffect(() => {
    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const closesAt = new Date(pollClosesAt).getTime();
      const difference = closesAt - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        } else if (minutes > 0) {
          setTimeLeft(`${minutes}m ${seconds}s`);
        } else {
          setTimeLeft(`${seconds}s`);
        }
      } else {
        setTimeLeft('Poll closed');
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [pollClosesAt]);

  const handleRankChange = (submissionId: string, newRank: number) => {
    const newRankings = [...rankings];
    
    // Remove the submission from its current position
    const currentIndex = newRankings.indexOf(submissionId);
    if (currentIndex !== -1) {
      newRankings.splice(currentIndex, 1);
    }
    
    // Insert at new position
    newRankings.splice(newRank - 1, 0, submissionId);
    
    setRankings(newRankings);
  };

  const handleSubmitVote = () => {
    if (rankings.length === 0) return;

    const vote: Omit<Vote, 'id' | 'submittedAt'> = {
      pollId,
      userId,
      rankings
    };

    onVote(vote);
  };

  const isPollClosed = new Date().getTime() >= new Date(pollClosesAt).getTime();
  const hasVoted = existingVote !== undefined;

  if (submissions.length === 0) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        marginBottom: '1rem'
      }}>
        <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#333' }}>
          🗳️ Book Voting
        </h4>
        <p style={{ color: '#666', margin: 0 }}>
          No books have been submitted yet. Submit a book to start the voting process!
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      marginBottom: '1rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0, color: '#333' }}>
          🗳️ Book Voting
        </h4>
        <div style={{
          background: isPollClosed ? '#dc3545' : '#28a745',
          color: 'white',
          padding: '0.25rem 0.75rem',
          borderRadius: '20px',
          fontSize: '0.9rem',
          fontWeight: '500'
        }}>
          {isPollClosed ? 'Closed' : timeLeft}
        </div>
      </div>

      {isPollClosed ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔒</div>
          <h5 style={{ color: '#333', marginBottom: '0.5rem' }}>Voting Closed</h5>
          <p style={{ color: '#666', margin: 0 }}>
            The voting period has ended. Check the results below!
          </p>
        </div>
      ) : (
        <div>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Rank the books in order of preference (1 = most preferred):
            {hasVoted && ' You can update your vote at any time until the poll closes.'}
          </p>

          <div style={{ marginBottom: '1.5rem' }}>
            {submissions.map((submission, index) => {
              const currentRank = rankings.indexOf(submission.id) + 1;
              return (
                <div
                  key={submission.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    marginBottom: '0.75rem',
                    background: currentRank > 0 ? '#f8f9fa' : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ minWidth: '60px' }}>
                    <select
                      value={currentRank || ''}
                      onChange={(e) => handleRankChange(submission.id, parseInt(e.target.value))}
                      style={{
                        padding: '0.5rem',
                        border: '2px solid #e1e5e9',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        textAlign: 'center',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="">-</option>
                      {Array.from({ length: submissions.length }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>

                  {submission.bookDetails.coverUrl && (
                    <img
                      src={submission.bookDetails.coverUrl}
                      alt={submission.bookDetails.title}
                      style={{
                        width: '50px',
                        height: '75px',
                        objectFit: 'cover',
                        borderRadius: '4px'
                      }}
                    />
                  )}

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      {submission.bookDetails.title}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                      by {submission.bookDetails.author}
                    </div>
                    {submission.comment && (
                      <div style={{ color: '#555', fontSize: '0.8rem', fontStyle: 'italic' }}>
                        "{submission.comment}"
                      </div>
                    )}
                  </div>

                  <div style={{ color: '#999', fontSize: '0.8rem' }}>
                    Submitted by {getUserName(submission.userId)}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#666', fontSize: '0.9rem' }}>
              {rankings.length > 0 ? `${rankings.length} book${rankings.length === 1 ? '' : 's'} ranked` : 'No books ranked yet'}
            </div>
            <button
              onClick={handleSubmitVote}
              disabled={rankings.length === 0}
              style={{
                background: rankings.length > 0 ? '#007bff' : '#e1e5e9',
                color: rankings.length > 0 ? 'white' : '#999',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: rankings.length > 0 ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (rankings.length > 0) {
                  e.currentTarget.style.backgroundColor = '#0056b3';
                }
              }}
              onMouseLeave={(e) => {
                if (rankings.length > 0) {
                  e.currentTarget.style.backgroundColor = '#007bff';
                }
              }}
            >
              {hasVoted ? 'Update Vote' : 'Submit Vote'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VotingCard;
