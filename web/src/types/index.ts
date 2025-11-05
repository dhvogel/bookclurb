import { User } from 'firebase/auth';
import { Database } from 'firebase/database';

export interface Member {
  name: string;
  img: string;
  bookData?: Array<{
    title: string;
    read: boolean;
    halfCredit?: boolean;
  }>;
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
  isPublic?: boolean; // Whether the club is visible on the public clubs page
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
    pageCount?: number;
    progress?: {
      percentage?: number; // 0-100
      currentPages?: number;
      totalPages?: number;
    };
    schedule?: Array<{
      date: string;
      pages?: number;
      chapter?: number;
    }>;
  };
  onDeckBook?: {
    title: string;
    author?: string;
    isbn?: string;
    coverUrl?: string;
  };
  memberCount: number;
  booksRead?: Array<{
    title: string;
    author?: string;
    isbn?: string;
    coverUrl?: string;
    readBy: string[]; // Array of member names who read this book
    completedAt?: string; // When the club finished reading this book
    ratings?: Record<string, number>; // Map of userId to rating (1-5)
  }>;
  members?: Array<{
    id: string;
    name: string;
    avatar?: string;
    img?: string;
    role?: 'admin' | 'member';
    joinedAt?: string; // ISO timestamp of when the member joined the club
    bookData?: Array<{
      title: string;
      read: boolean;
      halfCredit?: boolean;
    }>;
  }>;
  recentActivity?: Array<{
    id: string;
    type: 'discussion' | 'meeting' | 'book_change' | 'member_join';
    title: string;
    author: string;
    timestamp: string;
    content?: string;
  }>;
  meetings?: Array<{
    id: string;
    time: string;
    reading: string;
    date: string;
    status: 'upcoming' | 'past' | 'current';
    reflections?: Array<{
      userId: string;
      userName: string;
      reflection: string;
      timestamp: number;
    }>;
    archivedReflections?: Array<{
      userId: string;
      userName: string;
      reflection: string;
      timestamp: number;
    }>;
  }>;
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
    pageCount?: number;
  };
}
