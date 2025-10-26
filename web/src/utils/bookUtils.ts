import { Club } from '../types';

/**
 * Extracts unique books read by the club from member bookData
 * @param club - The club object containing members with bookData
 * @returns Array of unique books read by the club
 */
export const extractClubBooksRead = (club: Club) => {
  if (!club.members) return [];

  const bookMap = new Map<string, {
    title: string;
    author?: string;
    isbn?: string;
    coverUrl?: string;
    readBy: string[];
    completedAt?: string;
  }>();

  // Process each member's bookData
  club.members.forEach(member => {
    if (member.bookData) {
      member.bookData.forEach(book => {
        if (book.read) {
          const existingBook = bookMap.get(book.title);
          if (existingBook) {
            // Add member to readBy list if not already there
            if (!existingBook.readBy.includes(member.name)) {
              existingBook.readBy.push(member.name);
            }
          } else {
            // Create new book entry
            bookMap.set(book.title, {
              title: book.title,
              readBy: [member.name],
              // You can add more book details here if available
              // author, isbn, coverUrl, completedAt can be populated from other sources
            });
          }
        }
      });
    }
  });

  return Array.from(bookMap.values());
};

/**
 * Gets reading statistics for a club
 * @param club - The club object
 * @returns Object containing reading statistics
 */
export const getClubReadingStats = (club: Club) => {
  const booksRead = extractClubBooksRead(club);
  const totalBooks = booksRead.length;
  const totalMembers = club.members?.length || 0;
  
  // Calculate average books read per member
  const totalReads = booksRead.reduce((sum, book) => sum + book.readBy.length, 0);
  const avgBooksPerMember = totalMembers > 0 ? totalReads / totalMembers : 0;
  
  // Find most popular book (read by most members)
  const mostPopularBook = booksRead.reduce((mostPopular, book) => 
    book.readBy.length > mostPopular.readBy.length ? book : mostPopular, 
    booksRead[0] || { title: 'None', readBy: [] }
  );

  return {
    totalBooks,
    totalMembers,
    avgBooksPerMember: Math.round(avgBooksPerMember * 10) / 10, // Round to 1 decimal
    mostPopularBook: mostPopularBook.title,
    mostPopularBookReaders: mostPopularBook.readBy.length,
    booksRead
  };
};
