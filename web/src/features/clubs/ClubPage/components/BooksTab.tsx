import React, { useState } from 'react';
import { Database, ref, update } from 'firebase/database';
import { BookSubmission, Club } from '../../../../types';
import BookSubmissionCard from './BookSubmissionCard';
import CreatePollCard from './CreatePollCard';
import RandomDrawWheel from './RandomDrawWheel';
import EditBookReadersModal from './EditBookReadersModal';
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
    loading,
    error,
    submitBook,
    getUserSubmissions
  } = useBookVoting({ db, clubId: club.id, userId });

  const [settingOnDeck, setSettingOnDeck] = useState<string | null>(null);
  const [showWheel, setShowWheel] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [editingBookIndex, setEditingBookIndex] = useState<number | null>(null);
  const [savingBookReaders, setSavingBookReaders] = useState(false);

  // Check if current user is an admin
  const isAdmin = club.members?.some(
    member => member.id === userId && member.role === 'admin'
  );

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

  // Function to set a book as "On Deck"
  const handleSetOnDeck = async (book: { title: string; author?: string; isbn?: string; coverUrl?: string }) => {
    if (!isAdmin) return;

    setSettingOnDeck(book.title);
    try {
      const clubRef = ref(db, `clubs/${club.id}`);
      await update(clubRef, {
        onDeckBook: {
          title: book.title,
          author: book.author || '',
          isbn: book.isbn || '',
          coverUrl: book.coverUrl || ''
        }
      });
    } catch (error) {
      console.error('Failed to set On Deck book:', error);
      alert('Failed to set On Deck book. Please try again.');
    } finally {
      setSettingOnDeck(null);
    }
  };

  // Function to remove "On Deck" designation
  const handleRemoveOnDeck = async () => {
    if (!isAdmin) return;

    setSettingOnDeck('remove');
    try {
      const clubRef = ref(db, `clubs/${club.id}`);
      await update(clubRef, {
        onDeckBook: null
      });
      // Clear the selected submission ID when removing on deck
      setSelectedSubmissionId(null);
    } catch (error) {
      console.error('Failed to remove On Deck book:', error);
      alert('Failed to remove On Deck book. Please try again.');
    } finally {
      setSettingOnDeck(null);
    }
  };

  // Function to make On Deck book the current book and move current book to history
  const handleMakeCurrentBook = async () => {
    if (!isAdmin || !club.onDeckBook) return;

    setSettingOnDeck('makeCurrent');
    try {
      const clubRef = ref(db, `clubs/${club.id}`);
      const updates: any = {};

      // Get all member IDs for readBy array
      const memberIds = club.members?.map(m => m.id).filter(Boolean) || [];

      // If there's a current book, move it to booksRead
      if (club.currentBook) {
        const existingBooksRead = club.booksRead || [];
        const newBookEntry = {
          title: club.currentBook.title,
          author: club.currentBook.author || '',
          isbn: club.currentBook.isbn || '',
          coverUrl: club.currentBook.coverUrl || '',
          readBy: memberIds,
          completedAt: new Date().toISOString().split('T')[0] // Today's date in YYYY-MM-DD format
        };

        // Check if book already exists in booksRead (to avoid duplicates)
        const bookExists = existingBooksRead.some(
          (book: any) => book.title === club.currentBook?.title
        );

        if (!bookExists) {
          updates.booksRead = [...existingBooksRead, newBookEntry];
        }
      }

      // Make onDeckBook the currentBook
      updates.currentBook = {
        title: club.onDeckBook.title,
        author: club.onDeckBook.author || '',
        isbn: club.onDeckBook.isbn || '',
        coverUrl: club.onDeckBook.coverUrl || ''
      };

      // Clear onDeckBook
      updates.onDeckBook = null;

      await update(clubRef, updates);
    } catch (error) {
      console.error('Failed to make On Deck book current:', error);
      alert('Failed to make On Deck book current. Please try again.');
    } finally {
      setSettingOnDeck(null);
    }
  };

  const handleBookSubmission = async (submission: Omit<BookSubmission, 'id' | 'submittedAt'>) => {
    try {
      await submitBook(submission);
    } catch (error) {
      console.error('Failed to submit book:', error);
    }
  };

  // Function to show the wheel
  const handleRandomDraw = () => {
    if (!isAdmin || submissions.length === 0) return;
    setShowWheel(true);
  };

  // Function to handle when wheel selects a book
  const handleWheelSelect = async (selectedSubmission: BookSubmission) => {
    // Mark this submission as selected for the "On Deck" label
    setSelectedSubmissionId(selectedSubmission.id);
    // Set the selected book as "On Deck"
    await handleSetOnDeck({
      title: selectedSubmission.bookDetails.title,
      author: selectedSubmission.bookDetails.author,
      isbn: selectedSubmission.bookDetails.isbn,
      coverUrl: selectedSubmission.bookDetails.coverUrl
    });
  };

  // Function to handle updating who read a book
  const handleUpdateBookReaders = async (bookIndex: number, readBy: string[]) => {
    if (!club.booksRead || bookIndex < 0 || bookIndex >= club.booksRead.length) {
      return;
    }

    setSavingBookReaders(true);
    try {
      const clubRef = ref(db, `clubs/${club.id}`);
      const updatedBooksRead = [...club.booksRead];
      updatedBooksRead[bookIndex] = {
        ...updatedBooksRead[bookIndex],
        readBy: readBy
      };
      
      await update(clubRef, {
        booksRead: updatedBooksRead
      });
      
      setEditingBookIndex(null);
    } catch (error) {
      console.error('Failed to update book readers:', error);
      alert('Failed to update book readers. Please try again.');
    } finally {
      setSavingBookReaders(false);
    }
  };

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
        <p style={{ color: '#666' }}>Loading book submissions...</p>
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
        {/* On Deck Book Card */}
        {club.onDeckBook && (
          <div style={{
            background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
            border: '2px solid #667eea',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '1rem',
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>📌</span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333', margin: 0 }}>
                  On Deck
                </h3>
              </div>
              {isAdmin && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={handleMakeCurrentBook}
                    disabled={settingOnDeck === 'makeCurrent'}
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      background: settingOnDeck === 'makeCurrent'
                        ? '#ccc'
                        : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: settingOnDeck === 'makeCurrent' ? 'not-allowed' : 'pointer',
                      transition: 'opacity 0.2s',
                      opacity: settingOnDeck === 'makeCurrent' ? 0.7 : 1
                    }}
                  >
                    {settingOnDeck === 'makeCurrent' ? 'Updating...' : 'Make Current Book'}
                  </button>
                  <button
                    onClick={handleRemoveOnDeck}
                    disabled={settingOnDeck === 'remove'}
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      background: settingOnDeck === 'remove'
                        ? '#ccc'
                        : '#dc3545',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: settingOnDeck === 'remove' ? 'not-allowed' : 'pointer',
                      transition: 'opacity 0.2s',
                      opacity: settingOnDeck === 'remove' ? 0.7 : 1
                    }}
                  >
                    {settingOnDeck === 'remove' ? 'Removing...' : 'Remove from On Deck'}
                  </button>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              {club.onDeckBook.coverUrl && (
                <img
                  src={club.onDeckBook.coverUrl}
                  alt={club.onDeckBook.title}
                  style={{
                    width: '120px',
                    height: '180px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    objectFit: 'cover'
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#333' }}>
                  {club.onDeckBook.title}
                </h4>
                {club.onDeckBook.author && (
                  <p style={{ color: '#666', marginBottom: '1rem', fontSize: '1rem' }}>
                    by {club.onDeckBook.author}
                  </p>
                )}
                <p style={{ 
                  color: '#667eea', 
                  fontSize: '0.9rem', 
                  fontStyle: 'italic',
                  margin: 0
                }}>
                  Next up for the club!
                </p>
              </div>
            </div>
          </div>
        )}

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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
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
                        </div>
                        {isAdmin && (
                          <button
                            onClick={() => setEditingBookIndex(index)}
                            style={{
                              padding: '0.4rem 0.8rem',
                              fontSize: '0.8rem',
                              fontWeight: '500',
                              background: '#667eea',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'background-color 0.2s ease',
                              marginLeft: '1rem',
                              whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#5568d3';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#667eea';
                            }}
                          >
                            Edit
                          </button>
                        )}
                      </div>
                      
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

  return (
    <div>
      {/* On Deck Book Card */}
      {club.onDeckBook && (
        <div style={{
          background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
          border: '2px solid #667eea',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '1rem',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📌</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333', margin: 0 }}>
                On Deck
              </h3>
            </div>
            {isAdmin && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleMakeCurrentBook}
                  disabled={settingOnDeck === 'makeCurrent'}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    background: settingOnDeck === 'makeCurrent'
                      ? '#ccc'
                      : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: settingOnDeck === 'makeCurrent' ? 'not-allowed' : 'pointer',
                    transition: 'opacity 0.2s',
                    opacity: settingOnDeck === 'makeCurrent' ? 0.7 : 1
                  }}
                >
                  {settingOnDeck === 'makeCurrent' ? 'Updating...' : 'Make Current Book'}
                </button>
                <button
                  onClick={handleRemoveOnDeck}
                  disabled={settingOnDeck === 'remove'}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.85rem',
                    fontWeight: '500',
                    background: settingOnDeck === 'remove'
                      ? '#ccc'
                      : '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: settingOnDeck === 'remove' ? 'not-allowed' : 'pointer',
                    transition: 'opacity 0.2s',
                    opacity: settingOnDeck === 'remove' ? 0.7 : 1
                  }}
                >
                  {settingOnDeck === 'remove' ? 'Removing...' : 'Remove from On Deck'}
                </button>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {club.onDeckBook.coverUrl && (
              <img
                src={club.onDeckBook.coverUrl}
                alt={club.onDeckBook.title}
                style={{
                  width: '120px',
                  height: '180px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                  objectFit: 'cover'
                }}
              />
            )}
            <div style={{ flex: 1 }}>
              <h4 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#333' }}>
                {club.onDeckBook.title}
              </h4>
              {club.onDeckBook.author && (
                <p style={{ color: '#666', marginBottom: '1rem', fontSize: '1rem' }}>
                  by {club.onDeckBook.author}
                </p>
              )}
              <p style={{ 
                color: '#667eea', 
                fontSize: '0.9rem', 
                fontStyle: 'italic',
                margin: 0
              }}>
                Next up for the club!
              </p>
            </div>
          </div>
        </div>
      )}

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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
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
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => setEditingBookIndex(index)}
                          style={{
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            background: '#667eea',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s ease',
                            marginLeft: '1rem',
                            whiteSpace: 'nowrap'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#5568d3';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#667eea';
                          }}
                        >
                          Edit
                        </button>
                      )}
                    </div>
                    
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

      {/* Book Submission System */}
      {currentPoll && (
        <>
          <BookSubmissionCard
            pollId={currentPoll.id}
            userId={userId}
            onSubmission={handleBookSubmission}
            existingSubmissions={submissions}
            maxSubmissions={2}
          />

          {submissions.length > 0 && (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              marginBottom: '1rem'
            }}>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#333' }}>
                📚 Submitted Books
              </h4>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                {submissions.length} book{submissions.length !== 1 ? 's' : ''} submitted for the next selection
              </p>
              
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                {submissions.map((submission) => {
                  const isOnDeck = club.onDeckBook?.title === submission.bookDetails.title;
                  return (
                    <div
                      key={submission.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1rem',
                        border: isOnDeck ? '2px solid #667eea' : '2px solid #e1e5e9',
                        borderRadius: '8px',
                        background: isOnDeck ? 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)' : '#f8f9fa',
                        position: 'relative',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {isOnDeck && (
                        <div style={{
                          position: 'absolute',
                          top: '-10px',
                          right: '10px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          <span>📌</span>
                          <span>On Deck</span>
                        </div>
                      )}
                      {submission.bookDetails.coverUrl && (
                        <img
                          src={submission.bookDetails.coverUrl}
                          alt={submission.bookDetails.title}
                          style={{
                            width: '60px',
                            height: '90px',
                            objectFit: 'cover',
                            borderRadius: '4px'
                          }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem', color: isOnDeck ? '#667eea' : '#333' }}>
                          {submission.bookDetails.title}
                        </div>
                        <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                          by {submission.bookDetails.author}
                        </div>
                        {submission.comment && (
                          <div style={{ color: '#555', fontSize: '0.85rem', fontStyle: 'italic', marginTop: '0.5rem' }}>
                            "{submission.comment}"
                          </div>
                        )}
                        <div style={{ color: '#999', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                          Submitted by {getUserName(submission.userId)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {isAdmin && (
                <button
                  onClick={handleRandomDraw}
                  disabled={settingOnDeck !== null || showWheel}
                  style={{
                    background: settingOnDeck !== null || showWheel 
                      ? '#ccc' 
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '1rem 2rem',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    cursor: settingOnDeck !== null || showWheel ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    width: '100%',
                    boxShadow: settingOnDeck !== null || showWheel 
                      ? 'none' 
                      : '0 4px 15px rgba(102, 126, 234, 0.4)',
                    transform: settingOnDeck !== null || showWheel ? 'none' : 'translateY(0)'
                  }}
                  onMouseEnter={(e) => {
                    if (settingOnDeck === null && !showWheel) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (settingOnDeck === null && !showWheel) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                    }
                  }}
                >
                  {showWheel ? 'Processing...' : settingOnDeck !== null ? 'Processing...' : '🎲 Random Draw!'}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Random Draw Wheel Modal */}
      <RandomDrawWheel
        submissions={submissions}
        isOpen={showWheel}
        onClose={() => setShowWheel(false)}
        onSelect={handleWheelSelect}
      />

      {/* Edit Book Readers Modal */}
      {editingBookIndex !== null && club.booksRead && club.booksRead[editingBookIndex] && (
        <EditBookReadersModal
          book={club.booksRead[editingBookIndex]}
          club={club}
          isOpen={true}
          saving={savingBookReaders}
          onClose={() => setEditingBookIndex(null)}
          onSave={(readBy) => handleUpdateBookReaders(editingBookIndex, readBy)}
        />
      )}
    </div>
  );
};

export default BooksTab;
