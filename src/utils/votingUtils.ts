import { BookSubmission, Vote } from '../types';

export interface IRVResult {
  submission: BookSubmission;
  eliminatedInRound: number;
  votesInEachRound: number[];
  isWinner: boolean;
}

export interface IRVStep {
  round: number;
  activeSubmissions: string[];
  voteCounts: { [submissionId: string]: number };
  eliminated: string[];
  winner?: string;
}

/**
 * Implements Instant-Runoff Voting (IRV) algorithm
 * @param submissions Array of book submissions
 * @param votes Array of votes with rankings
 * @returns Detailed IRV results with elimination rounds
 */
export function calculateInstantRunoffVoting(
  submissions: BookSubmission[],
  votes: Vote[]
): { results: IRVResult[], steps: IRVStep[] } {
  if (votes.length === 0) {
    return {
      results: submissions.map(submission => ({
        submission,
        eliminatedInRound: 0,
        votesInEachRound: [],
        isWinner: false
      })),
      steps: []
    };
  }

  const submissionIds = submissions.map(s => s.id);
  const results: IRVResult[] = submissions.map(submission => ({
    submission,
    eliminatedInRound: 0,
    votesInEachRound: [],
    isWinner: false
  }));

  const steps: IRVStep[] = [];
  let activeSubmissions = [...submissionIds];
  let round = 0;

  while (activeSubmissions.length > 1) {
    round++;
    
    // Count first-choice votes for active submissions
    const voteCounts: { [submissionId: string]: number } = {};
    activeSubmissions.forEach(id => {
      voteCounts[id] = 0;
    });

    votes.forEach(vote => {
      const firstChoice = vote.rankings.find(rankedId => 
        activeSubmissions.includes(rankedId)
      );
      if (firstChoice) {
        voteCounts[firstChoice]++;
      }
    });

    // Record vote counts for this round
    results.forEach(result => {
      result.votesInEachRound[round - 1] = voteCounts[result.submission.id] || 0;
    });

    // Check for majority winner
    const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);
    const majorityThreshold = Math.floor(totalVotes / 2) + 1;
    
    const winner = Object.entries(voteCounts).find(([_, count]) => count >= majorityThreshold);
    
    if (winner) {
      // Found a winner
      const [winnerId] = winner;
      results.find(r => r.submission.id === winnerId)!.isWinner = true;
      
      steps.push({
        round,
        activeSubmissions,
        voteCounts,
        eliminated: [],
        winner: winnerId
      });
      
      break;
    }

    // Find the submission(s) with the fewest votes
    const minVotes = Math.min(...Object.values(voteCounts));
    const eliminated = Object.entries(voteCounts)
      .filter(([_, count]) => count === minVotes)
      .map(([id, _]) => id);

    // Mark as eliminated
    eliminated.forEach(id => {
      const result = results.find(r => r.submission.id === id);
      if (result && result.eliminatedInRound === 0) {
        result.eliminatedInRound = round;
      }
    });

    // Remove eliminated submissions from active list
    activeSubmissions = activeSubmissions.filter(id => !eliminated.includes(id));

    steps.push({
      round,
      activeSubmissions,
      voteCounts,
      eliminated
    });
  }

  // If only one submission remains, it's the winner
  if (activeSubmissions.length === 1) {
    const winnerId = activeSubmissions[0];
    results.find(r => r.submission.id === winnerId)!.isWinner = true;
    
    steps.push({
      round: round + 1,
      activeSubmissions,
      voteCounts: { [winnerId]: votes.length },
      eliminated: [],
      winner: winnerId
    });
  }

  return { results, steps };
}

/**
 * Calculate simple vote statistics for display
 */
export function calculateVoteStats(submissions: BookSubmission[], votes: Vote[]) {
  const stats = submissions.map(submission => {
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
      percentage: votes.length > 0 ? (firstChoiceVotes / votes.length) * 100 : 0
    };
  });

  // Sort by first choice votes, then by average rank
  return stats.sort((a, b) => {
    if (b.firstChoiceVotes !== a.firstChoiceVotes) {
      return b.firstChoiceVotes - a.firstChoiceVotes;
    }
    return a.averageRank - b.averageRank;
  });
}

/**
 * Check if a poll should be closed based on time
 */
export function isPollClosed(closesAt: string): boolean {
  return new Date().getTime() >= new Date(closesAt).getTime();
}

/**
 * Format time remaining until poll closes
 */
export function formatTimeRemaining(closesAt: string): string {
  const now = new Date().getTime();
  const closesAtTime = new Date(closesAt).getTime();
  const difference = closesAtTime - now;

  if (difference <= 0) {
    return 'Poll closed';
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}
