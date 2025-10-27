import React from 'react';
import { Database } from 'firebase/database';
import { BookSubmission, Vote, Club } from '../../../../types';
import BookSubmissionCard from './BookSubmissionCard';
import VotingCard from './VotingCard';
import LeaderboardCard from './LeaderboardCard';
import CreatePollCard from './CreatePollCard';
import { isPollClosed } from '../../../../utils/votingUtils';
import { useBookVoting } from '../useBookVoting';

interface BooksTabProps {
  club: Club;
  userId: string;
  db: Database;
}

const BooksTab: React.FC<BooksTabProps> = ({ club, userId, db }) => {
  const {
    currentPoll,
    submissions,
    votes,
    loading,
    error,
    submitBook,
    submitVote,
    getUserVote,
    getUserSubmissions
  } = useBookVoting({ db, clubId: club.id, userId });

  // Helper function to map user IDs to member names
  const getUserName = (userId: string): string => {
    if (!club.members || !Array.isArray(club.members)) {
      return 'Unknown Member';
    }
    
    // Filter out any null/undefined members and find the matching one
    const validMembers = club.members.filter(member => member && member.id);
    const member = validMembers.find(m => m.id === userId);
    
    if (!member) {
      return 'Unknown Member';
    }
    
    return member.name || 'Unknown Member';
  };

  const handleBookSubmission = async (submission: Omit<BookSubmission, 'id' | 'submittedAt'>) => {
    try {
      await submitBook(submission);
    } catch (error) {
      console.error('Failed to submit book:', error);
    }
  };

  const handleVote = async (vote: Omit<Vote, 'id' | 'submittedAt'>) => {
    try {
      await submitVote(vote);
    } catch (error) {
      console.error('Failed to submit vote:', error);
    }
  };

  const userVote = getUserVote();

  if (loading) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ color: '#666' }}>Loading book voting...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
        <h3 style={{ color: '#dc3545', marginBottom: '1rem' }}>Error</h3>
        <p style={{ color: '#666' }}>{error}</p>
      </div>
    );
  }

  if (!currentPoll) {
    return (
      <div>
        {/* Book History Card */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          marginBottom: '1rem'
        }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#333' }}>
            Book History
          </h3>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Track the books we've read together as a club.
          </p>
          
          {club.booksRead && club.booksRead.length > 0 ? (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {club.booksRead.map((book, index) => (
                <div key={index} style={{
                  padding: '1.5rem',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    {/* Book Cover */}
                    <div style={{
                      width: '80px',
                      height: '120px',
                      background: book.coverUrl ? `url(${book.coverUrl}) center/cover` : '#e9ecef',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2rem',
                      color: '#6c757d'
                    }}>
                      {!book.coverUrl && '📖'}
                    </div>
                    
                    {/* Book Details */}
                    <div style={{ flex: 1 }}>
                      <h4 style={{ 
                        fontSize: '1.2rem', 
                        fontWeight: '600', 
                        marginBottom: '0.5rem', 
                        color: '#333',
                        margin: '0 0 0.5rem 0'
                      }}>
                        {book.title}
                      </h4>
                      {book.author && (
                        <p style={{ 
                          color: '#666', 
                          marginBottom: '0.5rem',
                          fontSize: '0.9rem',
                          margin: '0 0 0.5rem 0'
                        }}>
                          by {book.author}
                        </p>
                      )}
                      
                      {/* Read By Section */}
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ 
                          fontSize: '0.8rem', 
                          color: '#666', 
                          fontWeight: '500' 
                        }}>
                          Read by {book.readBy.length} member{book.readBy.length !== 1 ? 's' : ''}:
                        </span>
                        <div style={{ 
                          display: 'flex', 
                          flexWrap: 'wrap', 
                          gap: '0.25rem', 
                          marginTop: '0.25rem' 
                        }}>
                          {book.readBy.map((userId, memberIndex) => (
                            <span key={memberIndex} style={{
                              padding: '0.25rem 0.5rem',
                              background: '#667eea',
                              color: 'white',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}>
                              {getUserName(userId)}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      {/* Completion Date */}
                      {book.completedAt && (
                        <div style={{ 
                          fontSize: '0.8rem', 
                          color: '#666' 
                        }}>
                          Completed: {new Date(book.completedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
              <h4 style={{ color: '#333', marginBottom: '0.5rem' }}>No book history yet</h4>
              <p style={{ color: '#666', marginBottom: '2rem' }}>
                Our reading journey starts with the first book!
              </p>
            </div>
          )}
        </div>

        {/* Create New Poll */}
        <CreatePollCard clubId={club.id} userId={userId} db={db} />
      </div>
    );
  }

  const pollClosed = isPollClosed(currentPoll.closesAt);

  return (
    <div>
      {/* Book History Card */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        marginBottom: '1rem'
      }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#333' }}>
          Book History
        </h3>
        <p style={{ color: '#666', marginBottom: '2rem' }}>
          Track the books we've read together as a club.
        </p>
        
        {club.booksRead && club.booksRead.length > 0 ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {club.booksRead.map((book, index) => (
              <div key={index} style={{
                padding: '1.5rem',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  {/* Book Cover */}
                  <div style={{
                    width: '80px',
                    height: '120px',
                    background: book.coverUrl ? `url(${book.coverUrl}) center/cover` : '#e9ecef',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    color: '#6c757d'
                  }}>
                    {!book.coverUrl && '📖'}
                  </div>
                  
                  {/* Book Details */}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ 
                      fontSize: '1.2rem', 
                      fontWeight: '600', 
                      marginBottom: '0.5rem', 
                      color: '#333',
                      margin: '0 0 0.5rem 0'
                    }}>
                      {book.title}
                    </h4>
                    {book.author && (
                      <p style={{ 
                        color: '#666', 
                        marginBottom: '0.5rem',
                        fontSize: '0.9rem',
                        margin: '0 0 0.5rem 0'
                      }}>
                        by {book.author}
                      </p>
                    )}
                    
                    {/* Read By Section */}
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        color: '#666', 
                        fontWeight: '500' 
                      }}>
                        Read by {book.readBy.length} member{book.readBy.length !== 1 ? 's' : ''}:
                      </span>
                      <div style={{ 
                        display: 'flex', 
                        flexWrap: 'wrap', 
                        gap: '0.25rem', 
                        marginTop: '0.25rem' 
                      }}>
                        {book.readBy.map((userId, memberIndex) => (
                          <span key={memberIndex} style={{
                            padding: '0.25rem 0.5rem',
                            background: '#667eea',
                            color: 'white',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '500'
                          }}>
                            {getUserName(userId)}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Completion Date */}
                    {book.completedAt && (
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: '#666' 
                      }}>
                        Completed: {new Date(book.completedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
            <h4 style={{ color: '#333', marginBottom: '0.5rem' }}>No book history yet</h4>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
              Our reading journey starts with the first book!
            </p>
          </div>
        )}
      </div>

      {/* Book Voting System */}
      {currentPoll.status === 'submission' && (
        <>
          <BookSubmissionCard
            pollId={currentPoll.id}
            userId={userId}
            onSubmission={handleBookSubmission}
            existingSubmissions={submissions}
            maxSubmissions={2}
          />

          {submissions.length > 0 && (
            <>
              <VotingCard
                pollId={currentPoll.id}
                userId={userId}
                submissions={submissions}
                onVote={handleVote}
                existingVote={userVote}
                pollClosesAt={currentPoll.closesAt}
                club={club}
              />
              
              <LeaderboardCard
                submissions={submissions}
                votes={votes}
                pollClosesAt={currentPoll.closesAt}
                isPollClosed={pollClosed}
              />
            </>
          )}
        </>
      )}

      {currentPoll.status === 'voting' && (
        <>
          <VotingCard
            pollId={currentPoll.id}
            userId={userId}
            submissions={submissions}
            onVote={handleVote}
            existingVote={userVote}
            pollClosesAt={currentPoll.closesAt}
            club={club}
          />
          
          <LeaderboardCard
            submissions={submissions}
            votes={votes}
            pollClosesAt={currentPoll.closesAt}
            isPollClosed={pollClosed}
          />
        </>
      )}

      {currentPoll.status === 'closed' && (
        <LeaderboardCard
          submissions={submissions}
          votes={votes}
          pollClosesAt={currentPoll.closesAt}
          isPollClosed={true}
        />
      )}
    </div>
  );
};

export default BooksTab;
