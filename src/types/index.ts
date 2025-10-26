import { User } from 'firebase/auth';
import { Database } from 'firebase/database';

export interface Member {
  name: string;
  img: string;
}

export interface Book {
  title: string;
  read: boolean;
  halfCredit?: boolean;
}

export interface HeaderBarProps {
  user: User | null;
  db: Database;
}

export interface PeopleProps {
  user: User | null;
  db: Database;
}

export interface LoginProps {
  setUser: (user: User | null) => void;
  user: User | null;
  db: Database;
  auth: any; // Firebase Auth instance
}

export interface ProfileProps {
  user: User | null;
  db: Database;
}

export interface MeetingsProps {
  user: User | null;
  db: Database;
}

export interface LiteraryProfileProps {
  user: User | null;
  db: Database;
}

export interface ClubsProps {
  user: User | null;
  db: Database;
}

export interface ClubPageProps {
  user: User | null;
  db: Database;
}

export interface Club {
  id: string;
  name: string;
  coverImage?: string;
  coverColor?: string;
  description?: string;
  nextMeeting?: {
    timestamp: string;
    timeZone: string;
    location?: string;
  };
  currentBook?: {
    title: string;
    author?: string;
    isbn?: string;
    coverUrl?: string;
  };
  memberCount: number;
  members?: Array<{
    id: string;
    name: string;
    avatar?: string;
    img?: string;
    role?: 'admin' | 'member';
  }>;
  recentActivity?: Array<{
    id: string;
    type: 'discussion' | 'meeting' | 'book_change' | 'member_join';
    title: string;
    author: string;
    timestamp: string;
    content?: string;
  }>;
}

export interface Notification {
  isRead: boolean;
  [key: string]: any;
}

// Book Voting System Types
export interface BookVotingPoll {
  id: string;
  clubId: string;
  status: 'submission' | 'voting' | 'closed';
  closesAt: string;
  createdAt: string;
  createdBy: string;
}

export interface BookSubmission {
  id: string;
  pollId: string;
  userId: string;
  bookId: string;
  comment?: string;
  submittedAt: string;
  bookDetails: {
    title: string;
    author: string;
    isbn?: string;
    coverUrl?: string;
    description?: string;
    publishedDate?: string;
  };
}

export interface Vote {
  id: string;
  pollId: string;
  userId: string;
  rankings: string[]; // Array of book_submission_ids in order of preference
  submittedAt: string;
}

export interface GoogleBooksVolume {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    description?: string;
    publishedDate?: string;
  };
}
