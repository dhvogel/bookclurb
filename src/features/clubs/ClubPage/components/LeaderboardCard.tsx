import React from 'react';
import { BookSubmission, Vote } from '../../../../types';

interface LeaderboardCardProps {
  submissions: BookSubmission[];
  votes: Vote[];
  pollClosesAt: string;
  isPollClosed: boolean;
}

interface SubmissionResult {
  submission: BookSubmission;
  totalVotes: number;
  firstChoiceVotes: number;
  averageRank: number;
  isEliminated: boolean;
}

const LeaderboardCard: React.FC<LeaderboardCardProps> = ({
  submissions,
  votes,
  pollClosesAt,
  isPollClosed
}) => {
  // Calculate Instant-Runoff Voting results
  const calculateIRVResults = (): SubmissionResult[] => {
    if (votes.length === 0) {
      return submissions.map(submission => ({
        submission,
        totalVotes: 0,
        firstChoiceVotes: 0,
        averageRank: 0,
        isEliminated: false
      }));
    }

    const submissionResults: SubmissionResult[] = submissions.map(submission => {
      const submissionVotes = votes.filter(vote => 
        vote.rankings.includes(submission.id)
      );
      
      const firstChoiceVotes = votes.filter(vote => 
        vote.rankings[0] === submission.id
      ).length;

      const totalRanks = submissionVotes.reduce((sum, vote) => {
        const rank = vote.rankings.indexOf(submission.id) + 1;
        return sum + rank;
      }, 0);

      const averageRank = submissionVotes.length > 0 
        ? totalRanks / submissionVotes.length 
        : 0;

      return {
        submission,
        totalVotes: submissionVotes.length,
        firstChoiceVotes,
        averageRank,
        isEliminated: false
      };
    });

    // Sort by first choice votes, then by average rank
    return submissionResults.sort((a, b) => {
      if (b.firstChoiceVotes !== a.firstChoiceVotes) {
        return b.firstChoiceVotes - a.firstChoiceVotes;
      }
      return a.averageRank - b.averageRank;
    });
  };

  const results = calculateIRVResults();
  const totalVotes = votes.length;

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
          🏆 Live Leaderboard
        </h4>
        <p style={{ color: '#666', margin: 0 }}>
          No books have been submitted yet.
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
          🏆 Live Leaderboard
        </h4>
        <div style={{ color: '#666', fontSize: '0.9rem' }}>
          {totalVotes} vote{totalVotes !== 1 ? 's' : ''} cast
        </div>
      </div>

      {totalVotes === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🗳️</div>
          <h5 style={{ color: '#333', marginBottom: '0.5rem' }}>No Votes Yet</h5>
          <p style={{ color: '#666', margin: 0 }}>
            Be the first to vote for your favorite book!
          </p>
        </div>
      ) : (
        <div>
          {results.map((result, index) => {
            const isWinner = isPollClosed && index === 0 && result.firstChoiceVotes > 0;
            const percentage = totalVotes > 0 ? (result.firstChoiceVotes / totalVotes) * 100 : 0;
            
            return (
              <div
                key={result.submission.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  border: isWinner ? '3px solid #28a745' : '2px solid #e1e5e9',
                  borderRadius: '8px',
                  marginBottom: '0.75rem',
                  background: isWinner ? '#f8fff9' : '#f8f9fa',
                  position: 'relative'
                }}
              >
                {isWinner && (
                  <div style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    background: '#28a745',
                    color: 'white',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    fontWeight: 'bold'
                  }}>
                    👑
                  </div>
                )}

                <div style={{
                  minWidth: '40px',
                  textAlign: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: isWinner ? '#28a745' : '#666'
                }}>
                  {index + 1}
                </div>

                {result.submission.bookDetails.coverUrl && (
                  <img
                    src={result.submission.bookDetails.coverUrl}
                    alt={result.submission.bookDetails.title}
                    style={{
                      width: '50px',
                      height: '75px',
                      objectFit: 'cover',
                      borderRadius: '4px'
                    }}
                  />
                )}

                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    marginBottom: '0.25rem',
                    color: isWinner ? '#28a745' : '#333'
                  }}>
                    {result.submission.bookDetails.title}
                  </div>
                  <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    by {result.submission.bookDetails.author}
                  </div>
                  {result.submission.comment && (
                    <div style={{ color: '#555', fontSize: '0.8rem', fontStyle: 'italic' }}>
                      "{result.submission.comment}"
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right', minWidth: '120px' }}>
                  <div style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 'bold',
                    color: isWinner ? '#28a745' : '#333',
                    marginBottom: '0.25rem'
                  }}>
                    {result.firstChoiceVotes} vote{result.firstChoiceVotes !== 1 ? 's' : ''}
                  </div>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>
                    {percentage.toFixed(1)}%
                  </div>
                  {result.totalVotes > result.firstChoiceVotes && (
                    <div style={{ color: '#999', fontSize: '0.8rem' }}>
                      {result.totalVotes - result.firstChoiceVotes} other rank{result.totalVotes - result.firstChoiceVotes !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isPollClosed && results.length > 0 && results[0].firstChoiceVotes > 0 && (
            <div style={{
              background: '#e8f5e8',
              border: '2px solid #28a745',
              borderRadius: '8px',
              padding: '1rem',
              marginTop: '1rem',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#28a745', marginBottom: '0.5rem' }}>
                🎉 Winner: {results[0].submission.bookDetails.title}
              </div>
              <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>
                This book won with {results[0].firstChoiceVotes} first-choice vote{results[0].firstChoiceVotes !== 1 ? 's' : ''}!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeaderboardCard;
