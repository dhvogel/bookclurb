import React from 'react';
import { Database } from 'firebase/database';
import { BookSubmission, Vote } from '../../../../types';
import BookSubmissionCard from './BookSubmissionCard';
import VotingCard from './VotingCard';
import LeaderboardCard from './LeaderboardCard';
import CreatePollCard from './CreatePollCard';
import { isPollClosed } from '../../../../utils/votingUtils';
import { useBookVoting } from '../useBookVoting';

interface BooksTabProps {
  clubId: string;
  userId: string;
  db: Database;
}

const BooksTab: React.FC<BooksTabProps> = ({ clubId, userId, db }) => {
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
  } = useBookVoting({ db, clubId, userId });

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
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
            <h4 style={{ color: '#333', marginBottom: '0.5rem' }}>No book history yet</h4>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
              Our reading journey starts with the first book!
            </p>
          </div>
        </div>

        {/* Create New Poll */}
        <CreatePollCard clubId={clubId} userId={userId} db={db} />
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
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
          <h4 style={{ color: '#333', marginBottom: '0.5rem' }}>No book history yet</h4>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            Our reading journey starts with the first book!
          </p>
        </div>
      </div>

      {/* Book Voting System */}
      {currentPoll.status === 'submission' && (
        <BookSubmissionCard
          pollId={currentPoll.id}
          userId={userId}
          onSubmission={handleBookSubmission}
          existingSubmissions={submissions}
          maxSubmissions={2}
        />
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
