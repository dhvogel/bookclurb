import React from 'react';
import { BookSubmission, Vote } from '../../../../types';

interface LeaderboardCardProps {
  submissions: BookSubmission[];
  votes: Vote[];
  pollClosesAt: string;
  isPollClosed: boolean;
  isAdmin?: boolean;
  onSetOnDeck?: (book: { title: string; author?: string; isbn?: string; coverUrl?: string }) => void;
  settingOnDeck?: string | null;
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
  isPollClosed,
  isAdmin = false,
  onSetOnDeck,
  settingOnDeck = null
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
        vote.rankings && vote.rankings.includes(submission.id)
      );
      
      const firstChoiceVotes = votes.filter(vote => 
        vote.rankings && vote.rankings[0] === submission.id
      ).length;

      // Calculate rank distribution (how many votes at each rank)
      const rankDistribution: { [key: number]: number } = {};
      submissionVotes.forEach(vote => {
        const rank = vote.rankings.indexOf(submission.id) + 1;
        rankDistribution[rank] = (rankDistribution[rank] || 0) + 1;
      });

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
        isEliminated: false,
        rankDistribution // Add this for more detailed display
      } as SubmissionResult & { rankDistribution: { [key: number]: number } };
    });

    // Sort by: has votes (voted items first), then first choice votes, then average rank
    return submissionResults.sort((a, b) => {
      // First, separate books with votes from books without votes
      const aHasVotes = a.totalVotes > 0;
      const bHasVotes = b.totalVotes > 0;
      
      if (aHasVotes !== bHasVotes) {
        return aHasVotes ? -1 : 1; // Books with votes come first
      }
      
      // If both have votes or both don't, sort by first choice votes
      if (b.firstChoiceVotes !== a.firstChoiceVotes) {
        return b.firstChoiceVotes - a.firstChoiceVotes;
      }
      
      // Then by average rank
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
      padding: '1rem',
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
                  gap: '0.75rem',
                  padding: '0.75rem',
                  border: isWinner ? '3px solid #28a745' : '2px solid #e1e5e9',
                  borderRadius: '8px',
                  marginBottom: '0.75rem',
                  background: isWinner ? '#f8fff9' : '#f8f9fa',
                  position: 'relative',
                  flexWrap: 'wrap'
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
                  minWidth: '35px',
                  textAlign: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: isWinner ? '#28a745' : '#666',
                  flexShrink: 0
                }}>
                  {index + 1}
                </div>

                {result.submission.bookDetails.coverUrl && (
                  <img
                    src={result.submission.bookDetails.coverUrl}
                    alt={result.submission.bookDetails.title}
                    style={{
                      width: '45px',
                      height: '68px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      flexShrink: 0
                    }}
                  />
                )}

                <div style={{ flex: 1, minWidth: '150px', wordBreak: 'break-word' }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    marginBottom: '0.25rem',
                    color: isWinner ? '#28a745' : '#333',
                    fontSize: '0.95rem'
                  }}>
                    {result.submission.bookDetails.title}
                  </div>
                  <div style={{ color: '#666', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    by {result.submission.bookDetails.author}
                  </div>
                  {result.submission.comment && (
                    <div style={{ color: '#555', fontSize: '0.75rem', fontStyle: 'italic' }}>
                      "{result.submission.comment}"
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'right', minWidth: '100px', flexShrink: 1 }}>
                  <div style={{ 
                    fontSize: '0.95rem', 
                    fontWeight: 'bold',
                    color: isWinner ? '#28a745' : '#333',
                    marginBottom: '0.25rem',
                    wordBreak: 'break-word'
                  }}>
                    {result.firstChoiceVotes} vote{result.firstChoiceVotes !== 1 ? 's' : ''}
                  </div>
                  <div style={{ color: '#999', fontSize: '0.7rem' }}>
                    Avg: {result.averageRank > 0 ? result.averageRank.toFixed(1) : '-'}
                  </div>
                  {/* Admin Action: Set as On Deck - Only visible to admins on live leaderboard */}
                  {isAdmin === true && onSetOnDeck && !isPollClosed && (
                    <button
                      onClick={() => onSetOnDeck({
                        title: result.submission.bookDetails.title,
                        author: result.submission.bookDetails.author,
                        isbn: result.submission.bookDetails.isbn,
                        coverUrl: result.submission.bookDetails.coverUrl
                      })}
                      disabled={settingOnDeck === result.submission.bookDetails.title}
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.35rem 0.7rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        background: settingOnDeck === result.submission.bookDetails.title
                          ? '#ccc'
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: settingOnDeck === result.submission.bookDetails.title ? 'not-allowed' : 'pointer',
                        transition: 'opacity 0.2s',
                        opacity: settingOnDeck === result.submission.bookDetails.title ? 0.7 : 1,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {settingOnDeck === result.submission.bookDetails.title ? '...' : '📌 On Deck'}
                    </button>
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
