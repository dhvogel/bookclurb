import React, { useState, useEffect } from 'react';
import { GoogleBooksVolume, BookSubmission } from '../../../../types';

interface BookSubmissionCardProps {
  pollId: string;
  userId: string;
  onSubmission: (submission: Omit<BookSubmission, 'id' | 'submittedAt'>) => void;
  existingSubmissions: BookSubmission[];
  maxSubmissions?: number;
}

const BookSubmissionCard: React.FC<BookSubmissionCardProps> = ({
  pollId,
  userId,
  onSubmission,
  existingSubmissions,
  maxSubmissions = 2
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GoogleBooksVolume[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBook, setSelectedBook] = useState<GoogleBooksVolume | null>(null);
  const [comment, setComment] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const userSubmissions = existingSubmissions.filter(sub => sub.userId === userId);
  const canSubmitMore = userSubmissions.length < maxSubmissions;

  const searchBooks = async (query: string) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`
      );
      const data = await response.json();
      setSearchResults(data.items || []);
    } catch (error) {
      console.error('Error searching books:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        searchBooks(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleBookSelect = (book: GoogleBooksVolume) => {
    setSelectedBook(book);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSubmit = () => {
    if (!selectedBook) return;

    const isbn = selectedBook.volumeInfo.industryIdentifiers?.find(
      id => id.type === 'ISBN_13' || id.type === 'ISBN_10'
    )?.identifier;

    const submission: Omit<BookSubmission, 'id' | 'submittedAt'> = {
      pollId,
      userId,
      bookId: selectedBook.id,
      comment: comment.trim() || undefined,
      bookDetails: {
        title: selectedBook.volumeInfo.title,
        author: selectedBook.volumeInfo.authors?.join(', ') || 'Unknown Author',
        isbn,
        coverUrl: selectedBook.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:'),
        description: selectedBook.volumeInfo.description,
        publishedDate: selectedBook.volumeInfo.publishedDate
      }
    };

    onSubmission(submission);
    setSelectedBook(null);
    setComment('');
  };

  const handleCancel = () => {
    setSelectedBook(null);
    setComment('');
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  if (!canSubmitMore) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '1.5rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        marginBottom: '1rem'
      }}>
        <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#333' }}>
          📚 Book Submissions
        </h4>
        <p style={{ color: '#666', margin: 0 }}>
          You've reached the maximum number of submissions ({maxSubmissions}).
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
      <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#333' }}>
        📚 Submit a Book
      </h4>
      
      {!selectedBook ? (
        <div>
          <div style={{ marginBottom: '1rem' }}>
            <input
              type="text"
              placeholder="Search for a book..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearch(true)}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
            />
          </div>

          {showSearch && (
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              border: '1px solid #e1e5e9',
              borderRadius: '8px',
              background: 'white',
              position: 'relative',
              zIndex: 10
            }}>
              {isSearching && (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
                  Searching...
                </div>
              )}
              
              {searchResults.map((book) => (
                <div
                  key={book.id}
                  onClick={() => handleBookSelect(book)}
                  style={{
                    padding: '0.75rem',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {book.volumeInfo.imageLinks?.thumbnail && (
                    <img
                      src={book.volumeInfo.imageLinks.thumbnail.replace('http:', 'https:')}
                      alt={book.volumeInfo.title}
                      style={{
                        width: '40px',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '4px'
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                      {book.volumeInfo.title}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>
                      by {book.volumeInfo.authors?.join(', ') || 'Unknown Author'}
                    </div>
                    {book.volumeInfo.publishedDate && (
                      <div style={{ color: '#999', fontSize: '0.8rem' }}>
                        {book.volumeInfo.publishedDate}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {!isSearching && searchResults.length === 0 && searchQuery && (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
                  No books found
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1rem',
            padding: '1rem',
            background: '#f8f9fa',
            borderRadius: '8px'
          }}>
            {selectedBook.volumeInfo.imageLinks?.thumbnail && (
              <img
                src={selectedBook.volumeInfo.imageLinks.thumbnail.replace('http:', 'https:')}
                alt={selectedBook.volumeInfo.title}
                style={{
                  width: '60px',
                  height: '90px',
                  objectFit: 'cover',
                  borderRadius: '4px'
                }}
              />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                {selectedBook.volumeInfo.title}
              </div>
              <div style={{ color: '#666', marginBottom: '0.5rem' }}>
                by {selectedBook.volumeInfo.authors?.join(', ') || 'Unknown Author'}
              </div>
              {selectedBook.volumeInfo.description && (
                <div style={{ fontSize: '0.9rem', color: '#555', lineHeight: '1.4' }}>
                  {selectedBook.volumeInfo.description.substring(0, 150)}
                  {selectedBook.volumeInfo.description.length > 150 && '...'}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Why do you want to read this book? (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="I've wanted to read this forever..."
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '2px solid #e1e5e9',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                resize: 'vertical',
                minHeight: '80px'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleSubmit}
              style={{
                background: '#007bff',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
            >
              Submit Book
            </button>
            <button
              onClick={handleCancel}
              style={{
                background: 'transparent',
                color: '#666',
                border: '2px solid #e1e5e9',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
                e.currentTarget.style.borderColor = '#d1d5db';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = '#e1e5e9';
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {userSubmissions.length > 0 && (
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e1e5e9' }}>
          <h5 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#333' }}>
            Your Submissions ({userSubmissions.length}/{maxSubmissions})
          </h5>
          {userSubmissions.map((submission) => (
            <div
              key={submission.id}
              style={{
                display: 'flex',
                gap: '0.75rem',
                padding: '0.75rem',
                background: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '0.5rem'
              }}
            >
              {submission.bookDetails.coverUrl && (
                <img
                  src={submission.bookDetails.coverUrl}
                  alt={submission.bookDetails.title}
                  style={{
                    width: '40px',
                    height: '60px',
                    objectFit: 'cover',
                    borderRadius: '4px'
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                  {submission.bookDetails.title}
                </div>
                <div style={{ color: '#666', fontSize: '0.8rem' }}>
                  by {submission.bookDetails.author}
                </div>
                {submission.comment && (
                  <div style={{ color: '#555', fontSize: '0.8rem', fontStyle: 'italic', marginTop: '0.25rem' }}>
                    "{submission.comment}"
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookSubmissionCard;
