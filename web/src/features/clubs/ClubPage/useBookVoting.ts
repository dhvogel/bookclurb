import { useState, useEffect } from 'react';
import { ref, onValue, push, set, update, remove, query, orderByChild, equalTo } from 'firebase/database';
import { Database } from 'firebase/database';
import { BookVotingPoll, BookSubmission, Vote } from '../../../types';

interface UseBookVotingProps {
  db: Database;
  clubId: string;
  userId: string;
}

export const useBookVoting = ({ db, clubId, userId }: UseBookVotingProps) => {
  const [currentPoll, setCurrentPoll] = useState<BookVotingPoll | null>(null);
  const [submissions, setSubmissions] = useState<BookSubmission[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load current poll for the club
  useEffect(() => {
    const pollRef = ref(db, `clubs/${clubId}/polls`);
    const pollQuery = query(pollRef, orderByChild('status'));

    const unsubscribe = onValue(pollQuery, (snapshot) => {
      const polls = snapshot.val();
      
      if (polls) {
        const pollEntries = Object.entries(polls) as [string, BookVotingPoll][];
        const activePoll = pollEntries.find(([_, poll]) => 
          poll.status === 'submission' || poll.status === 'voting'
        );
        
        if (activePoll) {
          setCurrentPoll({ ...activePoll[1], id: activePoll[0] });
        } else {
          setCurrentPoll(null);
        }
      } else {
        setCurrentPoll(null);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error loading polls:', error);
      setError('Failed to load voting data');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, clubId]);

  // Load submissions for current poll
  useEffect(() => {
    if (!currentPoll) {
      setSubmissions([]);
      return;
    }

    const submissionsRef = ref(db, `clubs/${clubId}/submissions`);
    const submissionsQuery = query(submissionsRef, orderByChild('pollId'), equalTo(currentPoll.id));

    const unsubscribe = onValue(submissionsQuery, (snapshot) => {
      const submissionsData = snapshot.val();
      if (submissionsData) {
        const submissionsList = Object.entries(submissionsData).map(([id, submission]) => ({
          ...(submission as BookSubmission),
          id
        }));
        setSubmissions(submissionsList);
      } else {
        setSubmissions([]);
      }
    }, (error) => {
      console.error('Error loading submissions:', error);
      setError('Failed to load submissions');
    });

    return () => unsubscribe();
  }, [db, clubId, currentPoll]);

  // Load votes for current poll
  useEffect(() => {
    if (!currentPoll) {
      setVotes([]);
      return;
    }

    const votesRef = ref(db, `clubs/${clubId}/votes`);
    const votesQuery = query(votesRef, orderByChild('pollId'), equalTo(currentPoll.id));

    const unsubscribe = onValue(votesQuery, (snapshot) => {
      const votesData = snapshot.val();
      if (votesData) {
        const votesList = Object.entries(votesData).map(([id, vote]) => ({
          ...(vote as Vote),
          id
        }));
        setVotes(votesList);
      } else {
        setVotes([]);
      }
    }, (error) => {
      console.error('Error loading votes:', error);
      setError('Failed to load votes');
    });

    return () => unsubscribe();
  }, [db, clubId, currentPoll]);

  // Create a new poll
  const createPoll = async (closesAt: string): Promise<string> => {
    try {
      const pollRef = ref(db, `clubs/${clubId}/polls`);
      const newPollRef = push(pollRef);
      
      const poll: Omit<BookVotingPoll, 'id'> = {
        clubId,
        status: 'submission',
        closesAt,
        createdAt: new Date().toISOString(),
        createdBy: userId
      };

      await set(newPollRef, poll);
      return newPollRef.key!;
    } catch (error) {
      console.error('Error creating poll:', error);
      setError('Failed to create poll');
      throw error;
    }
  };

  // Submit a book
  const submitBook = async (submission: Omit<BookSubmission, 'id' | 'submittedAt'>): Promise<string> => {
    try {
      if (!currentPoll) {
        throw new Error('No active poll');
      }

      const submissionRef = ref(db, `clubs/${clubId}/submissions`);
      const newSubmissionRef = push(submissionRef);
      
      const fullSubmission: Omit<BookSubmission, 'id'> = {
        ...submission,
        submittedAt: new Date().toISOString()
      };

      await set(newSubmissionRef, fullSubmission);
      return newSubmissionRef.key!;
    } catch (error) {
      console.error('Error submitting book:', error);
      setError('Failed to submit book');
      throw error;
    }
  };

  // Submit a vote
  const submitVote = async (vote: Omit<Vote, 'id' | 'submittedAt'>): Promise<string> => {
    try {
      if (!currentPoll) {
        throw new Error('No active poll');
      }

      // Check if user already voted
      const existingVote = votes.find(v => v.userId === userId);
      
      if (existingVote) {
        // Update existing vote - use set to replace entire object
        const voteRef = ref(db, `clubs/${clubId}/votes/${existingVote.id}`);
        // Don't include 'id' in the saved data - Firebase uses it as the key
        const updatedVote: Omit<Vote, 'id'> = {
          ...vote,
          submittedAt: new Date().toISOString()
        };
        await set(voteRef, updatedVote);
        return existingVote.id;
      } else {
        // Create new vote
        const voteRef = ref(db, `clubs/${clubId}/votes`);
        const newVoteRef = push(voteRef);
        
        const fullVote: Omit<Vote, 'id'> = {
          ...vote,
          submittedAt: new Date().toISOString()
        };

        await set(newVoteRef, fullVote);
        return newVoteRef.key!;
      }
    } catch (error) {
      console.error('Error submitting vote:', error);
      setError('Failed to submit vote');
      throw error;
    }
  };

  // Update poll status
  const updatePollStatus = async (status: BookVotingPoll['status']): Promise<void> => {
    try {
      if (!currentPoll) {
        throw new Error('No active poll');
      }

      const pollRef = ref(db, `clubs/${clubId}/polls/${currentPoll.id}`);
      await update(pollRef, { status });
    } catch (error) {
      console.error('Error updating poll status:', error);
      setError('Failed to update poll status');
      throw error;
    }
  };

  // Get user's vote
  const getUserVote = (): Vote | undefined => {
    return votes.find(vote => vote.userId === userId);
  };

  // Get user's submissions
  const getUserSubmissions = (): BookSubmission[] => {
    return submissions.filter(submission => submission.userId === userId);
  };

  return {
    currentPoll,
    submissions,
    votes,
    loading,
    error,
    createPoll,
    submitBook,
    submitVote,
    updatePollStatus,
    getUserVote,
    getUserSubmissions
  };
};
