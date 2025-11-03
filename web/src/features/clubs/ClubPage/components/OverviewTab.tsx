import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Database, ref, update, set } from 'firebase/database';
import { Club, GoogleBooksVolume } from '../../../../types';

interface OverviewTabProps {
  club: Club;
  user: User | null;
  db: Database;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ club, user, db }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentChapter, setCurrentChapter] = useState<number>(
    club.currentBook?.progress?.currentChapter ?? 0
  );
  const [totalChapters, setTotalChapters] = useState<number>(
    club.currentBook?.progress?.totalChapters || 24
  );
  
  // State for adding/changing a book
  const [showAddBook, setShowAddBook] = useState(false);
  const [showChangeBook, setShowChangeBook] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GoogleBooksVolume[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBook, setSelectedBook] = useState<GoogleBooksVolume | null>(null);
  const [addingBook, setAddingBook] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleEntries, setScheduleEntries] = useState<Array<{
    date: string;
    chapter: number;
  }>>([]);

  // Check if current user is an admin
  const isAdmin = user && club.members?.some(
    member => member.id === user.uid && member.role === 'admin'
  );

  // Calculate percentage from chapters, or use stored percentage
  const progressPercentage = club.currentBook?.progress?.percentage !== undefined
    ? club.currentBook.progress.percentage
    : totalChapters > 0
      ? Math.round((currentChapter / totalChapters) * 100)
      : 0;

  const progressPercentageForDisplay = totalChapters > 0
    ? Math.round((currentChapter / totalChapters) * 100)
    : progressPercentage;

  const handleSave = async () => {
    if (!isAdmin || !club.currentBook) return;

    setSaving(true);
    try {
      const percentage = totalChapters > 0
        ? Math.round((currentChapter / totalChapters) * 100)
        : progressPercentage;

      const clubRef = ref(db, `clubs/${club.id}/currentBook/progress`);
      await update(clubRef, {
        currentChapter,
        totalChapters,
        percentage
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save progress:', error);
      alert('Failed to save progress. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setCurrentChapter(club.currentBook?.progress?.currentChapter ?? 0);
    setTotalChapters(club.currentBook?.progress?.totalChapters || 24);
    setIsEditing(false);
  };

  // Search for books
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
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleAddBook = async () => {
    if (!isAdmin || !selectedBook) return;

    setAddingBook(true);
    try {
      const isbn = selectedBook.volumeInfo.industryIdentifiers?.find(
        id => id.type === 'ISBN_13' || id.type === 'ISBN_10'
      )?.identifier;

      const clubRef = ref(db, `clubs/${club.id}`);
      const bookData: any = {
        title: selectedBook.volumeInfo.title,
        author: selectedBook.volumeInfo.authors?.join(', ') || 'Unknown Author'
      };

      if (isbn) {
        bookData.isbn = isbn;
      }
      if (selectedBook.volumeInfo.imageLinks?.thumbnail) {
        bookData.coverUrl = selectedBook.volumeInfo.imageLinks.thumbnail.replace('http:', 'https:');
      }

      await update(clubRef, {
        currentBook: bookData
      });

      // Reset form
      setShowAddBook(false);
      setSelectedBook(null);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to add book:', error);
      alert('Failed to add book. Please try again.');
    } finally {
      setAddingBook(false);
    }
  };

  const handleChangeBook = async () => {
    if (!isAdmin || !selectedBook) return;

    setAddingBook(true);
    try {
      const isbn = selectedBook.volumeInfo.industryIdentifiers?.find(
        id => id.type === 'ISBN_13' || id.type === 'ISBN_10'
      )?.identifier;

      const clubRef = ref(db, `clubs/${club.id}`);
      const updates: any = {};

      // If there's a current book, move it to booksRead
      if (club.currentBook) {
        const existingBooksRead = club.booksRead || [];
        const memberIds = club.members?.map(m => m.id).filter(Boolean) || [];
        const newBookEntry = {
          title: club.currentBook.title,
          author: club.currentBook.author || '',
          isbn: club.currentBook.isbn || '',
          coverUrl: club.currentBook.coverUrl || '',
          readBy: memberIds,
          completedAt: new Date().toISOString().split('T')[0]
        };

        // Check if book already exists in booksRead (to avoid duplicates)
        const bookExists = existingBooksRead.some(
          (book: any) => book.title === club.currentBook?.title
        );

        if (!bookExists) {
          updates.booksRead = [...existingBooksRead, newBookEntry];
        }
      }

      // Set new current book
      const bookData: any = {
        title: selectedBook.volumeInfo.title,
        author: selectedBook.volumeInfo.authors?.join(', ') || 'Unknown Author'
      };

      if (isbn) {
        bookData.isbn = isbn;
      }
      if (selectedBook.volumeInfo.imageLinks?.thumbnail) {
        bookData.coverUrl = selectedBook.volumeInfo.imageLinks.thumbnail.replace('http:', 'https:');
      }

      updates.currentBook = bookData;

      await update(clubRef, updates);

      // Reset form
      setShowChangeBook(false);
      setSelectedBook(null);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to change book:', error);
      alert('Failed to change book. Please try again.');
    } finally {
      setAddingBook(false);
    }
  };

  const handleCancelAddBook = () => {
    setShowAddBook(false);
    setShowChangeBook(false);
    setSelectedBook(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSaveSchedule = async () => {
    if (!isAdmin || !club.currentBook) return;

    try {
      const clubRef = ref(db, `clubs/${club.id}/currentBook/schedule`);
      await set(clubRef, scheduleEntries);
      setShowScheduleModal(false);
      alert('Schedule saved successfully!');
    } catch (error) {
      console.error('Failed to save schedule:', error);
      alert('Failed to save schedule. Please try again.');
    }
  };

  const handleAddScheduleEntry = () => {
    setScheduleEntries([...scheduleEntries, { date: '', chapter: 1 }]);
  };

  const handleRemoveScheduleEntry = (index: number) => {
    setScheduleEntries(scheduleEntries.filter((_, i) => i !== index));
  };

  const handleUpdateScheduleEntry = (index: number, field: 'date' | 'chapter', value: string | number) => {
    const updated = [...scheduleEntries];
    updated[index] = { ...updated[index], [field]: value };
    setScheduleEntries(updated);
  };

  return (
    <div>
        {/* On Deck Book */}
        {club.onDeckBook && (
          <div style={{
            background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
            border: '2px solid #667eea',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📌</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333', margin: 0 }}>
                On Deck
              </h3>
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

        {/* Current Book */}
        {!club.currentBook && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            {!showAddBook ? (
              <>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333', marginBottom: '0.5rem' }}>
                  No current book
                </h3>
                <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                  {isAdmin 
                    ? 'Add a book to get started with your reading journey!'
                    : 'Waiting for an admin to add a current book.'}
                </p>
                {isAdmin && (
                  <button
                    onClick={() => setShowAddBook(true)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      fontSize: '1rem',
                      fontWeight: '600',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    Add Book
                  </button>
                )}
              </>
            ) : (
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333', marginBottom: '1rem', textAlign: 'left' }}>
                  Add Current Book
                </h3>
                
                {!selectedBook ? (
                  <div>
                    <div style={{ marginBottom: '1rem' }}>
                      <input
                        type="text"
                        placeholder="Search for a book..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
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

                    {searchQuery && (
                      <div style={{
                        maxHeight: '300px',
                        overflowY: 'auto',
                        border: '1px solid #e1e5e9',
                        borderRadius: '8px',
                        background: 'white',
                        marginBottom: '1rem'
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

                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={handleCancelAddBook}
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

                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={handleCancelAddBook}
                        disabled={addingBook}
                        style={{
                          background: 'transparent',
                          color: '#666',
                          border: '2px solid #e1e5e9',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          fontWeight: '500',
                          cursor: addingBook ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s',
                          opacity: addingBook ? 0.6 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (!addingBook) {
                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                            e.currentTarget.style.borderColor = '#d1d5db';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!addingBook) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.borderColor = '#e1e5e9';
                          }
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddBook}
                        disabled={addingBook}
                        style={{
                          background: addingBook ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          fontWeight: '500',
                          cursor: addingBook ? 'not-allowed' : 'pointer',
                          transition: 'opacity 0.2s',
                          opacity: addingBook ? 0.7 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (!addingBook) {
                            e.currentTarget.style.opacity = '0.9';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!addingBook) {
                            e.currentTarget.style.opacity = '1';
                          }
                        }}
                      >
                        {addingBook ? 'Adding...' : 'Add Book'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {club.currentBook && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', position: 'relative' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333', margin: 0 }}>
                Current Book
              </h3>
              {isAdmin && !isEditing && !showChangeBook && (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                    style={{
                      padding: '0.5rem',
                      fontSize: '1rem',
                      fontWeight: '600',
                      background: '#e9ecef',
                      color: '#6c757d',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '2.5rem',
                      height: '2.5rem'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dee2e6'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
                  >
                    <span>⚙️</span>
                  </button>
                  
                  {showSettingsMenu && (
                    <>
                      <div
                        style={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          zIndex: 100
                        }}
                        onClick={() => setShowSettingsMenu(false)}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '0.5rem',
                        background: 'white',
                        borderRadius: '8px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        border: '1px solid #e1e5e9',
                        zIndex: 101,
                        minWidth: '180px',
                        overflow: 'hidden'
                      }}>
                        <button
                          onClick={() => {
                            setShowChangeBook(true);
                            setShowSettingsMenu(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            background: 'transparent',
                            color: '#333',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <span>📚</span>
                          <span>Change Book</span>
                        </button>
                        <div style={{
                          height: '1px',
                          background: '#e1e5e9',
                          margin: '0'
                        }} />
                        <button
                          onClick={() => {
                            setIsEditing(true);
                            setShowSettingsMenu(false);
                          }}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            background: 'transparent',
                            color: '#333',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <span>✏️</span>
                          <span>Edit Progress</span>
                        </button>
                        <div style={{
                          height: '1px',
                          background: '#e1e5e9',
                          margin: '0'
                        }} />
                        <button
                          onClick={() => {
                            setShowScheduleModal(true);
                            setShowSettingsMenu(false);
                            // Load existing schedule if available
                            if (club.currentBook?.schedule) {
                              setScheduleEntries(club.currentBook.schedule);
                            } else {
                              setScheduleEntries([]);
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            background: 'transparent',
                            color: '#333',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <span>📅</span>
                          <span>Set Schedule</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              {club.currentBook.coverUrl && (
                <img
                  src={club.currentBook.coverUrl}
                  alt={club.currentBook.title}
                  style={{
                    width: '120px',
                    height: '180px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}
                />
              )}
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '0.5rem', color: '#333' }}>
                  {club.currentBook.title}
                </h4>
                {club.currentBook.author && (
                  <p style={{ color: '#666', marginBottom: '1rem' }}>
                    by {club.currentBook.author}
                  </p>
                )}
              </div>
            </div>
            
            {/* Change Book Interface */}
            {showChangeBook && (
              <div style={{ 
                marginTop: '1.5rem', 
                padding: '1.5rem', 
                background: '#f8f9fa', 
                borderRadius: '8px',
                border: '2px solid #667eea'
              }}>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#333' }}>
                  Change Current Book
                </h4>
                <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  The current book will be moved to book history when you select a new one.
                </p>
                
                {!selectedBook ? (
                  <div>
                    <div style={{ marginBottom: '1rem' }}>
                      <input
                        type="text"
                        placeholder="Search for a book..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
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

                    {searchQuery && (
                      <div style={{
                        maxHeight: '300px',
                        overflowY: 'auto',
                        border: '1px solid #e1e5e9',
                        borderRadius: '8px',
                        background: 'white',
                        marginBottom: '1rem'
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

                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={handleCancelAddBook}
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
                ) : (
                  <div>
                    <div style={{
                      display: 'flex',
                      gap: '1rem',
                      marginBottom: '1rem',
                      padding: '1rem',
                      background: 'white',
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

                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={handleCancelAddBook}
                        disabled={addingBook}
                        style={{
                          background: 'transparent',
                          color: '#666',
                          border: '2px solid #e1e5e9',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          fontWeight: '500',
                          cursor: addingBook ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s',
                          opacity: addingBook ? 0.6 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (!addingBook) {
                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                            e.currentTarget.style.borderColor = '#d1d5db';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!addingBook) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.borderColor = '#e1e5e9';
                          }
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleChangeBook}
                        disabled={addingBook}
                        style={{
                          background: addingBook ? '#ccc' : '#28a745',
                          color: 'white',
                          border: 'none',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          fontWeight: '500',
                          cursor: addingBook ? 'not-allowed' : 'pointer',
                          transition: 'opacity 0.2s',
                          opacity: addingBook ? 0.7 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (!addingBook) {
                            e.currentTarget.style.opacity = '0.9';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!addingBook) {
                            e.currentTarget.style.opacity = '1';
                          }
                        }}
                      >
                        {addingBook ? 'Changing...' : 'Change Book'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Reading Progress Tracker - Full Width */}
            {!showChangeBook && (
              <div style={{ marginTop: '1.5rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <span style={{ fontSize: '1rem', fontWeight: '600', color: '#333' }}>
                  Reading Progress
                </span>
                <span style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: 'bold', 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {progressPercentageForDisplay}%
                </span>
              </div>

              {isEditing ? (
                <div style={{ 
                  padding: '1.5rem', 
                  background: '#f8f9fa', 
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.9rem', 
                      fontWeight: '600', 
                      color: '#333',
                      marginBottom: '0.5rem'
                    }}>
                      Current Chapter
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={totalChapters || 1000}
                      value={currentChapter}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (isNaN(value)) {
                          setCurrentChapter(0);
                        } else {
                          setCurrentChapter(Math.max(0, Math.min(value, totalChapters || 1000)));
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        fontSize: '1rem',
                        border: '2px solid #ddd',
                        borderRadius: '6px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.9rem', 
                      fontWeight: '600', 
                      color: '#333',
                      marginBottom: '0.5rem'
                    }}>
                      Total Chapters
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={totalChapters}
                      onChange={(e) => {
                        const total = Math.max(1, parseInt(e.target.value) || 1);
                        setTotalChapters(total);
                        if (currentChapter > total) {
                          setCurrentChapter(total);
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        fontSize: '1rem',
                        border: '2px solid #ddd',
                        borderRadius: '6px',
                        outline: 'none',
                        transition: 'border-color 0.2s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#ddd'}
                    />
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    gap: '0.75rem', 
                    justifyContent: 'flex-end' 
                  }}>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      style={{
                        padding: '0.75rem 1.5rem',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        background: '#f0f0f0',
                        color: '#333',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.6 : 1,
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => !saving && (e.currentTarget.style.backgroundColor = '#e0e0e0')}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{
                        padding: '0.75rem 1.5rem',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: saving ? 'not-allowed' : 'pointer',
                        opacity: saving ? 0.6 : 1,
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={(e) => !saving && (e.currentTarget.style.opacity = '0.9')}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = saving ? '0.6' : '1'}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Progress Bar Container - allows circle to overflow */}
                  <div style={{ 
                    position: 'relative',
                    padding: '4px 0',
                    marginBottom: '0.75rem'
                  }}>
                    {/* Progress Bar - Redesigned */}
                    <div style={{
                      width: '100%',
                      height: '12px',
                      backgroundColor: '#f0f0f5',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      position: 'relative',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
                    }}>
                      {/* Completed chapters */}
                      <div style={{
                        width: `${Math.min(progressPercentageForDisplay, 100)}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
                        backgroundSize: '200% 100%',
                        borderRadius: progressPercentageForDisplay >= 100 ? '20px' : '20px 0 0 20px',
                        transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                        position: 'relative',
                        boxShadow: '0 0 20px rgba(102, 126, 234, 0.4)',
                        animation: 'shimmer 3s ease-in-out infinite'
                      }} />
                      
                      {/* Remaining chapters */}
                      {progressPercentageForDisplay < 100 && (
                        <div style={{
                          position: 'absolute',
                          left: `${progressPercentageForDisplay}%`,
                          width: `${100 - progressPercentageForDisplay}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, rgba(255,107,107,0.3) 0%, rgba(255,142,142,0.4) 100%)',
                          borderRadius: '0 20px 20px 0',
                          borderLeft: '1px solid rgba(255,107,107,0.2)'
                        }} />
                      )}
                    </div>
                    
                    {/* Progress Indicator - Glowing dot at current position - positioned outside the bar */}
                    {progressPercentageForDisplay >= 0 && progressPercentageForDisplay < 100 && (
                      <div style={{
                        position: 'absolute',
                        left: `${Math.max(progressPercentageForDisplay, 0)}%`,
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '20px',
                        height: '20px',
                        backgroundColor: '#764ba2',
                        borderRadius: '50%',
                        boxShadow: '0 0 0 3px white, 0 0 0 5px rgba(118, 75, 162, 0.3), 0 2px 8px rgba(118, 75, 162, 0.4)',
                        zIndex: 10,
                        border: '2px solid white'
                      }} />
                    )}
                  </div>
                  
                  {/* Chapter Info */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.85rem',
                    color: '#666',
                    padding: '0 0.25rem'
                  }}>
                    <span style={{ fontWeight: '500', color: '#764ba2' }}>
                      {totalChapters > 0 ? (
                        currentChapter === 0 ? (
                          <>Just starting!</>
                        ) : (
                          <>Chapter {currentChapter}</>
                        )
                      ) : (
                        <>Progress: {progressPercentageForDisplay}%</>
                      )}
                    </span>
                    {totalChapters > 0 && (
                      <span style={{ color: '#999' }}>
                        of {totalChapters} chapter{totalChapters !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </>
              )}
              </div>
            )}
            
            <style>{`
              @keyframes shimmer {
                0%, 100% {
                  background-position: 0% 50%;
                }
                50% {
                  background-position: 100% 50%;
                }
              }
            `}</style>
          </div>
        )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
            onClick={() => setShowScheduleModal(false)}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#333' }}>
                Set Reading Schedule
              </h3>
              <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                Create a reading schedule for "{club.currentBook?.title}". Add dates and chapters to keep the club on track.
              </p>

              <div style={{ marginBottom: '1.5rem' }}>
                {scheduleEntries.map((entry, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      marginBottom: '1rem',
                      background: '#f9fafb'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#374151' }}>
                        Entry {index + 1}
                      </span>
                      <button
                        onClick={() => handleRemoveScheduleEntry(index)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '1.2rem',
                          padding: '0.25rem 0.5rem'
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
                          Date
                        </label>
                        <input
                          type="date"
                          value={entry.date}
                          onChange={(e) => handleUpdateScheduleEntry(index, 'date', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>
                      <div style={{ flex: '0 0 120px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
                          Read to Chapter
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={totalChapters || 999}
                          value={entry.chapter || ''}
                          onChange={(e) => handleUpdateScheduleEntry(index, 'chapter', parseInt(e.target.value) || 1)}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '0.9rem'
                          }}
                        />
                      </div>
                    </div>
                    {totalChapters > 0 && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                        {entry.chapter > 0 ? (
                          <span>
                            ~{Math.round((entry.chapter / totalChapters) * 100)}% of book
                          </span>
                        ) : (
                          <span>Set chapter to see progress</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {scheduleEntries.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                    No schedule entries yet. Click "Add Entry" to create one.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button
                  onClick={handleAddScheduleEntry}
                  style={{
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
                >
                  + Add Entry
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  style={{
                    background: 'transparent',
                    color: '#666',
                    border: '2px solid #e1e5e9',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
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
                <button
                  onClick={handleSaveSchedule}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Save Schedule
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OverviewTab;
