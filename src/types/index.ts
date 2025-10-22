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

export interface Notification {
  isRead: boolean;
  [key: string]: any;
}
