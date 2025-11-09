import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { Database, ref, update, set } from 'firebase/database';
import { Club, GoogleBooksVolume } from '../../../../types';
import OnDeckBookCard from './OnDeckBookCard';
import ReadingProgressTracker, { ReadingProgressTrackerRef } from './ReadingProgressTracker';
import ReadingScheduleDisplay from './ReadingScheduleDisplay';

interface OverviewTabProps {
  club: Club;
  user: User | null;
  db: Database;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ club, user, db }) => {
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
    pages?: number;
    chapter?: number;
  }>>([]);
  const [trackingMode, setTrackingMode] = useState<'pages' | 'chapters'>('pages');
  const [totalValue, setTotalValue] = useState<number | undefined>(undefined);
  // Track raw input values for number fields to allow typing
  const [rawInputValues, setRawInputValues] = useState<Record<string, string>>({});
  
  const progressTrackerRef = useRef<ReadingProgressTrackerRef>(null);

  // Check if current user is an admin
  const isAdmin = user && club.members?.some(
    member => member.id === user.uid && member.role === 'admin'
  );

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
      if (selectedBook.volumeInfo.pageCount) {
        bookData.pageCount = selectedBook.volumeInfo.pageCount;
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
      if (selectedBook.volumeInfo.pageCount) {
        bookData.pageCount = selectedBook.volumeInfo.pageCount;
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
      const clubRef = ref(db, `clubs/${club.id}/currentBook`);
      const updates: any = {
        schedule: scheduleEntries
      };
      
      // Save total pages or chapters based on tracking mode
      if (trackingMode === 'pages' && totalValue) {
        updates.progress = {
          ...club.currentBook.progress,
          totalPages: totalValue
        };
      } else if (trackingMode === 'chapters' && totalValue) {
        updates.progress = {
          ...club.currentBook.progress,
          totalChapters: totalValue
        };
      }
      
      await update(clubRef, updates);
      setShowScheduleModal(false);
      setRawInputValues({}); // Clear raw input values when modal closes
      alert('Schedule saved successfully!');
    } catch (error) {
      console.error('Failed to save schedule:', error);
      alert('Failed to save schedule. Please try again.');
    }
  };

  const handleAddScheduleEntry = () => {
    setScheduleEntries([...scheduleEntries, { date: '', pages: undefined, chapter: undefined }]);
  };

  const handleRemoveScheduleEntry = (index: number) => {
    setScheduleEntries(scheduleEntries.filter((_, i) => i !== index));
    // Clear raw input values for removed entry and shift indices
    setRawInputValues(prev => {
      const next = { ...prev };
      // Remove all entries for this index and above, then shift
      Object.keys(next).forEach(key => {
        const keyIndex = parseInt(key.split('-')[0]);
        if (keyIndex >= index) {
          delete next[key];
        }
      });
      return next;
    });
  };

  const handleUpdateScheduleEntry = (index: number, field: 'date' | 'pages' | 'chapter', value: string | number | undefined) => {
    const updated = [...scheduleEntries];
    if (field === 'date') {
      // Date is required, always set it
      updated[index] = { ...updated[index], date: value as string };
    } else if (value === undefined || value === '' || (typeof value === 'number' && value === 0)) {
      // Remove the field if it's undefined, empty, or 0
      const { [field]: _, ...rest } = updated[index];
      updated[index] = rest as any;
    } else {
    updated[index] = { ...updated[index], [field]: value };
    }
    setScheduleEntries(updated);
  };

  return (
    <div>
      <OnDeckBookCard club={club} />

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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333', margin: 0 }}>
                Current Book
              </h3>
                {isAdmin && !showChangeBook && (
                  <button
                    onClick={() => setShowChangeBook(true)}
                    style={{
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.7rem',
                      fontWeight: '400',
                      background: 'transparent',
                      color: '#999',
                      border: '1px solid transparent',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      opacity: 0.7
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#666';
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.borderColor = '#e0e0e0';
                      e.currentTarget.style.background = '#f8f9fa';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#999';
                      e.currentTarget.style.opacity = '0.7';
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    Change Book
                  </button>
                )}
                </div>
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
                          maxWidth: '600px',
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
                        maxWidth: '600px',
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
            
            {/* Reading Progress Tracker */}
            {!showChangeBook && (
              <ReadingProgressTracker
                ref={progressTrackerRef}
                club={club}
                isAdmin={!!isAdmin}
                onSave={async (currentPages, totalPages) => {
                  if (!isAdmin || !club.currentBook) return;
                  const percentage = totalPages > 0
                    ? Math.round((currentPages / totalPages) * 100)
                    : (club.currentBook?.progress?.percentage ?? 0);
                  const clubRef = ref(db, `clubs/${club.id}/currentBook/progress`);
                  await update(clubRef, {
                    currentPages,
                    totalPages,
                    percentage
                  });
                }}
              />
            )}

            {/* Reading Schedule Display */}
            <ReadingScheduleDisplay 
              club={club} 
              isAdmin={!!isAdmin}
              onOpenScheduleModal={() => {
                setShowScheduleModal(true);
                // Load existing schedule if available
                if (club.currentBook?.schedule) {
                  setScheduleEntries(club.currentBook.schedule);
                  // Determine tracking mode from existing entries
                  const hasPages = club.currentBook.schedule.some(e => e.pages);
                  const hasChapters = club.currentBook.schedule.some(e => e.chapter);
                  if (hasPages) {
                    setTrackingMode('pages');
                    setTotalValue(club.currentBook.progress?.totalPages);
                  } else if (hasChapters) {
                    setTrackingMode('chapters');
                    const progress = club.currentBook.progress as any;
                    setTotalValue(progress?.totalChapters);
                  }
                } else {
                  setScheduleEntries([]);
                  setTrackingMode('pages');
                  setTotalValue(undefined);
                }
              }}
              onMarkCompleted={async (entryIndex, pages, chapter, isUnmarking = false) => {
                if (!isAdmin || !club.currentBook) return;
                
                // Determine if tracking by chapters
                const schedule = club.currentBook.schedule || [];
                const hasChapters = schedule.some(e => e.chapter);
                const hasPages = schedule.some(e => e.pages);
                const trackingByChapters = hasChapters && !hasPages;
                
                // Get the correct total based on tracking mode
                let totalPages = 0;
                if (trackingByChapters) {
                  const progress = club.currentBook.progress as any;
                  const totalChapters = progress?.totalChapters;
                  if (totalChapters) {
                    totalPages = totalChapters * 12; // Convert to pages for calculation
                  } else {
                    totalPages = club.currentBook.pageCount || 300;
                  }
                } else {
                  totalPages = club.currentBook.progress?.totalPages ?? club.currentBook.pageCount ?? 300;
                }
                
                if (isUnmarking) {
                  // Find the previous meeting's target
                  let newCurrentPages = 0;
                  const schedule = club.currentBook.schedule || [];
                  
                  // Look for previous meetings
                  for (let i = entryIndex - 1; i >= 0; i--) {
                    const prevEntry = schedule[i];
                    if (prevEntry) {
                      if (prevEntry.pages && prevEntry.pages > 0) {
                        newCurrentPages = prevEntry.pages;
                        break;
                      } else if (prevEntry.chapter) {
                        newCurrentPages = prevEntry.chapter * 12;
                        break;
                      }
                    }
                  }
                  // If no previous meeting found, set to 0
                  
                  const percentage = totalPages > 0
                    ? Math.round((newCurrentPages / totalPages) * 100)
                    : 0;
                  
                  // Update Firebase
                  const clubRef = ref(db, `clubs/${club.id}/currentBook/progress`);
                  await update(clubRef, {
                    currentPages: newCurrentPages,
                    totalPages,
                    percentage
                  });
                } else {
                  // Calculate the target pages based on what's set
                  let targetPages = 0;
                  if (pages && pages > 0) {
                    targetPages = pages;
                  } else if (chapter) {
                    // Estimate 12 pages per chapter
                    targetPages = chapter * 12;
                  } else {
                    return; // No target set, can't mark as completed
                  }
                  
                  // Check if this is the last meeting in the schedule
                  const isLastMeeting = entryIndex === schedule.length - 1;
                  
                  // Update progress to the target pages (or keep current if already higher)
                  // If it's the last meeting, set to total to reach 100%
                  const currentPages = club.currentBook.progress?.currentPages ?? 0;
                  let newCurrentPages = Math.max(currentPages, targetPages);
                  
                  // If this is the last meeting, ensure progress reaches the total
                  if (isLastMeeting && newCurrentPages < totalPages) {
                    newCurrentPages = totalPages;
                  }
                  
                  // Calculate percentage
                  const percentage = totalPages > 0
                    ? Math.round((newCurrentPages / totalPages) * 100)
                    : (club.currentBook.progress?.percentage ?? 0);
                  
                  // Update Firebase
                  const clubRef = ref(db, `clubs/${club.id}/currentBook/progress`);
                  await update(clubRef, {
                    currentPages: newCurrentPages,
                    totalPages,
                    percentage
                  });
                }
              }}
            />
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
            onClick={() => {
              setShowScheduleModal(false);
              setRawInputValues({}); // Clear raw input values when modal closes
            }}
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
              
              {/* Explanation Box */}
              <div style={{ 
                background: '#f0f4ff', 
                padding: '1rem', 
                borderRadius: '8px', 
                marginBottom: '1.5rem',
                border: '1px solid #c7d2fe'
              }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#667eea', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>💡</span>
                  <span>What is a reading schedule?</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#374151', lineHeight: '1.5' }}>
                  Set reading goals for each meeting to keep everyone on track. Members can see what to read by when, and you can track progress as meetings are completed.
                </div>
              </div>

              {/* Tracking Mode Selector */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Track by
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      setTrackingMode('pages');
                      setRawInputValues({}); // Clear raw input values when tracking mode changes
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      background: trackingMode === 'pages' ? '#667eea' : '#f0f0f0',
                      color: trackingMode === 'pages' ? 'white' : '#666',
                      border: '1px solid',
                      borderColor: trackingMode === 'pages' ? '#667eea' : '#e0e0e0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Pages
                  </button>
                  <button
                    onClick={() => {
                      setTrackingMode('chapters');
                      setRawInputValues({}); // Clear raw input values when tracking mode changes
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      background: trackingMode === 'chapters' ? '#667eea' : '#f0f0f0',
                      color: trackingMode === 'chapters' ? 'white' : '#666',
                      border: '1px solid',
                      borderColor: trackingMode === 'chapters' ? '#667eea' : '#e0e0e0',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Chapters
                  </button>
                </div>
              </div>

              {/* Total Input */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Total {trackingMode === 'pages' ? 'Pages in Book' : 'Chapters in Book'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={totalValue || ''}
                  onChange={(e) => setTotalValue(e.target.value ? parseInt(e.target.value) : undefined)}
                  style={{
                    width: '100%',
                    maxWidth: '200px',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    height: '38px',
                    boxSizing: 'border-box'
                  }}
                  placeholder={`Enter total ${trackingMode}`}
                />
              </div>

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
                        Meeting {index + 1}
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
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
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
                            fontSize: '0.9rem',
                            height: '38px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                      <div style={{ flex: '0 0 140px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                          Read up to {trackingMode === 'pages' ? 'Page' : 'Chapter'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={totalValue || 9999}
                          value={rawInputValues[`${index}-${trackingMode}`] ?? (trackingMode === 'pages' ? (entry.pages ?? '') : (entry.chapter ?? ''))}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            const inputKey = `${index}-${trackingMode}`;
                            
                            // Store raw input value for immediate display
                            setRawInputValues(prev => ({
                              ...prev,
                              [inputKey]: inputValue
                            }));
                            
                            const updated = [...scheduleEntries];
                            
                            // Parse the input value, handling empty strings and invalid input
                            let numValue: number | undefined = undefined;
                            if (inputValue !== '' && inputValue != null) {
                              const parsed = parseInt(inputValue, 10);
                              if (!isNaN(parsed) && parsed >= 0) {
                                numValue = parsed;
                              }
                            }
                            
                            if (trackingMode === 'pages') {
                              if (inputValue === '' || numValue === undefined) {
                                // Clear pages field when empty or invalid
                                const { pages: _, chapter: __, ...rest } = updated[index];
                                updated[index] = { ...rest };
                              } else {
                                // Update pages with valid number
                                updated[index] = { ...updated[index], pages: numValue };
                                // Clear chapter when setting pages
                                const { chapter: _, ...rest } = updated[index];
                                updated[index] = rest as any;
                              }
                            } else {
                              if (inputValue === '' || numValue === undefined) {
                                // Clear chapter field when empty or invalid
                                const { chapter: _, pages: __, ...rest } = updated[index];
                                updated[index] = { ...rest };
                              } else {
                                // Update chapter with valid number
                                updated[index] = { ...updated[index], chapter: numValue };
                                // Clear pages when setting chapter
                                const { pages: _, ...rest } = updated[index];
                                updated[index] = rest as any;
                              }
                            }
                            
                            setScheduleEntries(updated);
                          }}
                          onBlur={(e) => {
                            // Clear raw input value on blur, let the actual value take over
                            const inputKey = `${index}-${trackingMode}`;
                            setRawInputValues(prev => {
                              const next = { ...prev };
                              delete next[inputKey];
                              return next;
                            });
                          }}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '0.9rem',
                            height: '38px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>
                    {totalValue && ((trackingMode === 'pages' && entry.pages) || (trackingMode === 'chapters' && entry.chapter)) && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
                          <span>
                          ~{Math.round((((trackingMode === 'pages' ? entry.pages : entry.chapter) || 0) / totalValue) * 100)}% of book
                          </span>
                      </div>
                    )}
                  </div>
                ))}
                {scheduleEntries.length === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '2rem', 
                    background: '#f9fafb',
                    borderRadius: '8px',
                    border: '2px dashed #d1d5db'
                  }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                      No meetings added yet
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem' }}>
                      Click "Add Meeting" below to create your first reading checkpoint
                    </div>
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
                  + Add Meeting
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    setRawInputValues({}); // Clear raw input values when modal closes
                  }}
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
