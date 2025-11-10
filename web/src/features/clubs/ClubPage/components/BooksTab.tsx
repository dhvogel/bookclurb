import React, { useState, useEffect } from 'react';
import { Database, ref, update, get } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { BookSubmission, Club } from '../../../../types';
import BookSubmissionCard from './BookSubmissionCard';
import CreatePollCard from './CreatePollCard';
import RandomDrawWheel from './RandomDrawWheel';
import EditBookReadersModal from './EditBookReadersModal';
import StarRating from './StarRating';
import { useBookVoting } from '../useBookVoting';
import { getInviteServiceURL } from '../../../../config/runtimeConfig';

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
  const [savingRatings, setSavingRatings] = useState<Record<number, boolean>>({});
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [editingReviewIndex, setEditingReviewIndex] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState<string>('');
  const [savingReviews, setSavingReviews] = useState<Record<number, boolean>>({});
  const [hardcoverToken, setHardcoverToken] = useState<string | null>(null);
  const [syncingToHardcover, setSyncingToHardcover] = useState<Record<number, boolean>>({});
  const [hardcoverSyncSuccess, setHardcoverSyncSuccess] = useState<Record<number, boolean>>({});
  const [syncingReviewToHardcover, setSyncingReviewToHardcover] = useState<Record<number, boolean>>({});
  const [hardcoverReviewSyncSuccess, setHardcoverReviewSyncSuccess] = useState<Record<number, boolean>>({});
  const [showHardcoverTooltip, setShowHardcoverTooltip] = useState<Record<number, boolean>>({});

  // Check if current user is an admin
  const isAdmin = club.members?.some(
    member => member.id === userId && member.role === 'admin'
  );

  // Load Hardcover token on mount
  useEffect(() => {
    const loadHardcoverToken = async () => {
      if (!userId || !db) return;
      
      try {
        const userRef = ref(db, `users/${userId}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();
        
        if (userData?.hardcoverApiToken) {
          setHardcoverToken(userData.hardcoverApiToken);
        }
      } catch (error) {
        console.error('Error loading Hardcover token:', error);
      }
    };

    loadHardcoverToken();
  }, [userId, db]);

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

  // Function to handle deleting a book from history
  const handleDeleteBook = async (bookIndex: number) => {
    if (!club.booksRead || bookIndex < 0 || bookIndex >= club.booksRead.length) {
      return;
    }

    const book = club.booksRead[bookIndex];
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${book.title}" from the book history? This action cannot be undone.`
    );

    if (!confirmDelete) {
      return;
    }

    setSavingBookReaders(true);
    try {
      const clubRef = ref(db, `clubs/${club.id}`);
      const updatedBooksRead = club.booksRead.filter((_, index) => index !== bookIndex);
      
      await update(clubRef, {
        booksRead: updatedBooksRead
      });
      
      setEditingBookIndex(null);
    } catch (error) {
      console.error('Failed to delete book:', error);
      alert('Failed to delete book. Please try again.');
    } finally {
      setSavingBookReaders(false);
    }
  };

  // Function to calculate average rating for a book
  const calculateAverageRating = (ratings?: Record<string, number>): number => {
    if (!ratings || Object.keys(ratings).length === 0) {
      return 0;
    }
    const ratingValues = Object.values(ratings);
    const sum = ratingValues.reduce((acc, val) => acc + val, 0);
    return sum / ratingValues.length;
  };

  // Function to handle rating changes
  const handleRatingChange = async (bookIndex: number, rating: number) => {
    if (!club.booksRead || bookIndex < 0 || bookIndex >= club.booksRead.length) {
      return;
    }

    setSavingRatings(prev => ({ ...prev, [bookIndex]: true }));
    try {
      const clubRef = ref(db, `clubs/${club.id}`);
      const updatedBooksRead = [...club.booksRead];
      const currentRatings = updatedBooksRead[bookIndex].ratings || {};
      const book = updatedBooksRead[bookIndex];
      
      updatedBooksRead[bookIndex] = {
        ...updatedBooksRead[bookIndex],
        ratings: {
          ...currentRatings,
          [userId]: rating
        }
      };
      
      await update(clubRef, {
        booksRead: updatedBooksRead
      });

      // Always sync to Hardcover if token exists and book has ISBN
      if (hardcoverToken && book.isbn) {
        setSyncingToHardcover(prev => ({ ...prev, [bookIndex]: true }));
        setHardcoverSyncSuccess(prev => ({ ...prev, [bookIndex]: false }));
        try {
          // Get current review for this user to include in sync
          const currentReview = book.reviews?.[userId] || '';
          
          // Get Firebase ID token for authentication
          const auth = getAuth();
          const currentUser = auth.currentUser;
          if (!currentUser) {
            throw new Error('User not authenticated');
          }
          const idToken = await currentUser.getIdToken();
          
          const inviteServiceURL = getInviteServiceURL();
          const response = await fetch(`${inviteServiceURL}/SyncRatingToHardcover`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              isbn: book.isbn,
              rating: rating,
              reviewText: currentReview || undefined
            })
          });

          if (response.ok) {
            const syncResult = await response.json();
            if (syncResult.success) {
              setHardcoverSyncSuccess(prev => ({ ...prev, [bookIndex]: true }));
              // Clear success message after 2 seconds
              setTimeout(() => {
                setHardcoverSyncSuccess(prev => ({ ...prev, [bookIndex]: false }));
              }, 2000);
            } else {
              console.error('Failed to sync rating to Hardcover:', syncResult.error);
              // Don't show error to user, just log it
            }
          } else {
            const errorText = await response.text();
            console.error('Failed to sync rating to Hardcover:', errorText);
          }
        } catch (error) {
          console.error('Error syncing to Hardcover:', error);
        } finally {
          setSyncingToHardcover(prev => ({ ...prev, [bookIndex]: false }));
        }
      }
    } catch (error) {
      console.error('Failed to save rating:', error);
      alert('Failed to save rating. Please try again.');
    } finally {
      setSavingRatings(prev => ({ ...prev, [bookIndex]: false }));
    }
  };

  // Function to handle review changes
  const handleReviewSave = async (bookIndex: number) => {
    if (!club.booksRead || bookIndex < 0 || bookIndex >= club.booksRead.length) {
      return;
    }

    setSavingReviews(prev => ({ ...prev, [bookIndex]: true }));
    try {
      const clubRef = ref(db, `clubs/${club.id}`);
      const updatedBooksRead = [...club.booksRead];
      const currentReviews = updatedBooksRead[bookIndex].reviews || {};
      
      // If review text is empty, remove the review
      if (reviewText.trim() === '') {
        const { [userId]: _, ...rest } = currentReviews;
        
        if (Object.keys(rest).length > 0) {
          // If there are other reviews, keep the reviews property with remaining reviews
          updatedBooksRead[bookIndex] = {
            ...updatedBooksRead[bookIndex],
            reviews: rest
          };
        } else {
          // If no reviews left, remove the reviews property entirely by omitting it
          const { reviews: _, ...bookWithoutReviews } = updatedBooksRead[bookIndex];
          updatedBooksRead[bookIndex] = bookWithoutReviews as any;
        }
      } else {
        updatedBooksRead[bookIndex] = {
          ...updatedBooksRead[bookIndex],
          reviews: {
            ...currentReviews,
            [userId]: reviewText.trim()
          }
        };
      }
      
      await update(clubRef, {
        booksRead: updatedBooksRead
      });
      
      // Always sync review to Hardcover if token exists and book has ISBN
      const book = updatedBooksRead[bookIndex];
      if (hardcoverToken && book.isbn && reviewText.trim() !== '') {
        setSyncingReviewToHardcover(prev => ({ ...prev, [bookIndex]: true }));
        setHardcoverReviewSyncSuccess(prev => ({ ...prev, [bookIndex]: false }));
        try {
          // Get current rating for this user
          const currentRating = book.ratings?.[userId] || 0;
          
          // Get Firebase ID token for authentication
          const auth = getAuth();
          const currentUser = auth.currentUser;
          if (!currentUser) {
            throw new Error('User not authenticated');
          }
          const idToken = await currentUser.getIdToken();
          
          const inviteServiceURL = getInviteServiceURL();
          const response = await fetch(`${inviteServiceURL}/SyncReviewToHardcover`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              isbn: book.isbn,
              reviewText: reviewText.trim(),
              rating: currentRating
            })
          });

          if (response.ok) {
            const syncResult = await response.json();
            if (syncResult.success) {
              setHardcoverReviewSyncSuccess(prev => ({ ...prev, [bookIndex]: true }));
              // Clear success message after 2 seconds
              setTimeout(() => {
                setHardcoverReviewSyncSuccess(prev => ({ ...prev, [bookIndex]: false }));
              }, 2000);
            } else {
              console.error('Failed to sync review to Hardcover:', syncResult.error);
              // Don't show error to user, just log it
            }
          } else {
            const errorText = await response.text();
            console.error('Failed to sync review to Hardcover:', errorText);
          }
        } catch (error) {
          console.error('Error syncing review to Hardcover:', error);
        } finally {
          setSyncingReviewToHardcover(prev => ({ ...prev, [bookIndex]: false }));
        }
      }
      
      setEditingReviewIndex(null);
      setReviewText('');
    } catch (error) {
      console.error('Failed to save review:', error);
      alert('Failed to save review. Please try again.');
    } finally {
      setSavingReviews(prev => ({ ...prev, [bookIndex]: false }));
    }
  };

  // Function to start editing a review
  const handleStartEditReview = (bookIndex: number) => {
    if (!club.booksRead || bookIndex < 0 || bookIndex >= club.booksRead.length) {
      return;
    }
    const book = club.booksRead[bookIndex];
    const existingReview = book.reviews?.[userId] || '';
    setReviewText(existingReview);
    setEditingReviewIndex(bookIndex);
  };

  // Function to delete a review
  const handleDeleteReview = async (bookIndex: number) => {
    if (!club.booksRead || bookIndex < 0 || bookIndex >= club.booksRead.length) {
      return;
    }

    // Confirm deletion
    if (!window.confirm('Are you sure you want to delete your review?')) {
      return;
    }

    setSavingReviews(prev => ({ ...prev, [bookIndex]: true }));
    try {
      const clubRef = ref(db, `clubs/${club.id}`);
      const updatedBooksRead = [...club.booksRead];
      const currentReviews = updatedBooksRead[bookIndex].reviews || {};
      
      // Remove the user's review
      const { [userId]: _, ...rest } = currentReviews;
      
      if (Object.keys(rest).length > 0) {
        // If there are other reviews, keep the reviews property with remaining reviews
        updatedBooksRead[bookIndex] = {
          ...updatedBooksRead[bookIndex],
          reviews: rest
        };
      } else {
        // If no reviews left, remove the reviews property entirely by omitting it
        const { reviews: _, ...bookWithoutReviews } = updatedBooksRead[bookIndex];
        updatedBooksRead[bookIndex] = bookWithoutReviews as any;
      }
      
      await update(clubRef, {
        booksRead: updatedBooksRead
      });
      
      setEditingReviewIndex(null);
      setReviewText('');
    } catch (error) {
      console.error('Failed to delete review:', error);
      alert('Failed to delete review. Please try again.');
    } finally {
      setSavingReviews(prev => ({ ...prev, [bookIndex]: false }));
    }
  };

  // Get user's current rating for a book
  const getUserRating = (book: { ratings?: Record<string, number> }): number => {
    if (!book.ratings || !userId) {
      return 0;
    }
    return book.ratings[userId] || 0;
  };

  // Check if the current user has read the book
  const hasUserReadBook = (book: { readBy: string[] }): boolean => {
    if (!userId || !book.readBy) {
      return false;
    }
    return book.readBy.includes(userId);
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
                          color: '#666',
                          marginBottom: '0.5rem'
                        }}>
                          Completed: {new Date(book.completedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      )}
                      
                      {/* Rating Section */}
                      {((club as any).rituals?.bookCloseOut?.enableRating) && (
                        <div style={{ 
                          marginTop: '0.75rem',
                          padding: '0.75rem',
                          background: '#ffffff',
                          borderRadius: '6px',
                          border: '1px solid #e9ecef'
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '1rem',
                            flexWrap: 'wrap'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: '500', color: '#666' }}>
                                Your rating:
                              </span>
                              {savingRatings[index] || syncingToHardcover[index] || hardcoverSyncSuccess[index] ? (
                                <span style={{ fontSize: '0.8rem', color: syncingToHardcover[index] ? '#666' : hardcoverSyncSuccess[index] ? '#28a745' : '#666' }}>
                                  {syncingToHardcover[index] ? 'Syncing to Hardcover...' : hardcoverSyncSuccess[index] ? 'Syncing to Hardcover... Success!' : 'Saving...'}
                                </span>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <StarRating
                                    rating={getUserRating(book)}
                                    onRatingChange={(rating) => handleRatingChange(index, rating)}
                                    size="small"
                                    color={hardcoverToken && book.isbn ? '#6466F1' : undefined}
                                  />
                                  {hardcoverToken && book.isbn && (
                                    <div
                                      style={{
                                        position: 'relative',
                                        display: 'inline-block'
                                      }}
                                      onMouseEnter={() => setShowHardcoverTooltip(prev => ({ ...prev, [index]: true }))}
                                      onMouseLeave={() => setShowHardcoverTooltip(prev => ({ ...prev, [index]: false }))}
                                    >
                                      <button
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          cursor: 'help',
                                          padding: 0,
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                      >
                                        <img
                                          src="/hardcover_icon.png"
                                          alt="Hardcover"
                                          style={{
                                            width: '16px',
                                            height: '16px',
                                            objectFit: 'contain'
                                          }}
                                        />
                                      </button>
                                      {showHardcoverTooltip[index] && (
                                        <div
                                          style={{
                                            position: 'absolute',
                                            bottom: '100%',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            marginBottom: '0.5rem',
                                            width: '280px',
                                            background: '#f0f4ff',
                                            padding: '1rem',
                                            borderRadius: '8px',
                                            border: '1px solid #c7d2fe',
                                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                            zIndex: 1000,
                                            pointerEvents: 'none'
                                          }}
                                        >
                                          <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#667eea', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <img
                                              src="/hardcover_icon.png"
                                              alt="Hardcover"
                                              style={{
                                                width: '16px',
                                                height: '16px',
                                                objectFit: 'contain'
                                              }}
                                            />
                                            <span>Hardcover Sync</span>
                                          </div>
                                          <div style={{ fontSize: '0.85rem', color: '#374151', lineHeight: '1.5' }}>
                                            Ratings are automatically synced to your Hardcover account. To disable syncing, unlink your account in Profile settings.
                                          </div>
                                          <div
                                            style={{
                                              position: 'absolute',
                                              bottom: '-6px',
                                              left: '50%',
                                              transform: 'translateX(-50%)',
                                              width: 0,
                                              height: 0,
                                              borderLeft: '6px solid transparent',
                                              borderRight: '6px solid transparent',
                                              borderTop: '6px solid #c7d2fe'
                                            }}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            {book.ratings && Object.keys(book.ratings).length > 0 && (
                              <>
                                {(getUserRating(book) > 0 || book.ratings) && (
                                  <div style={{ width: '1px', height: '20px', background: '#e9ecef' }} />
                                )}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <span style={{ fontSize: '0.85rem', fontWeight: '500', color: '#666' }}>
                                    Average:
                                  </span>
                                  <StarRating
                                    rating={calculateAverageRating(book.ratings)}
                                    readOnly={true}
                                    size="small"
                                  />
                                  <span style={{ 
                                    fontSize: '0.85rem', 
                                    color: '#666',
                                    marginLeft: '0.25rem'
                                  }}>
                                    ({calculateAverageRating(book.ratings).toFixed(1)})
                                  </span>
                                  <span style={{ 
                                    fontSize: '0.75rem', 
                                    color: '#999',
                                    marginLeft: '0.5rem'
                                  }}>
                                    ({Object.keys(book.ratings).length} rating{Object.keys(book.ratings).length !== 1 ? 's' : ''})
                                  </span>
                                </div>
                              </>
                            )}
                          </div>
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
                        color: '#666',
                        marginBottom: '0.5rem'
                      }}>
                        Completed: {new Date(book.completedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    )}
                    
                    {/* Rating Section */}
                    {((club as any).rituals?.bookCloseOut?.enableRating) && (
                      <div className="rating-section-container" style={{ 
                        marginTop: '0.75rem',
                        padding: '0.75rem',
                        background: '#ffffff',
                        borderRadius: '6px',
                        border: '1px solid #e9ecef'
                      }}>
                        <style>{`
                          .rating-section-container .rating-content {
                            display: flex;
                            align-items: center;
                            gap: 1rem;
                            flex-wrap: wrap;
                          }
                          .rating-section-container .rating-divider {
                            width: 1px;
                            height: 20px;
                            background: #e9ecef;
                          }
                          @media (max-width: 768px) {
                            .rating-section-container .rating-content {
                              flex-direction: column;
                              align-items: flex-start;
                              gap: 0.75rem;
                            }
                            .rating-section-container .rating-divider {
                              display: none;
                            }
                            .rating-section-container .rating-item {
                              width: 100%;
                            }
                          }
                        `}</style>
                        <div className="rating-content">
                          <div className="rating-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: '500', color: '#666' }}>
                              Your rating:
                            </span>
                            {savingRatings[index] || syncingToHardcover[index] || hardcoverSyncSuccess[index] ? (
                              <span style={{ fontSize: '0.8rem', color: syncingToHardcover[index] ? '#666' : hardcoverSyncSuccess[index] ? '#28a745' : '#666' }}>
                                {syncingToHardcover[index] ? 'Syncing to Hardcover...' : hardcoverSyncSuccess[index] ? 'Syncing to Hardcover... Success!' : 'Saving...'}
                              </span>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <StarRating
                                  rating={getUserRating(book)}
                                  onRatingChange={(rating) => handleRatingChange(index, rating)}
                                  size="small"
                                  color={hardcoverToken && book.isbn ? '#9333EA' : undefined}
                                />
                                {hardcoverToken && book.isbn && (
                                  <div
                                    style={{
                                      position: 'relative',
                                      display: 'inline-block'
                                    }}
                                    onMouseEnter={() => setShowHardcoverTooltip(prev => ({ ...prev, [index]: true }))}
                                    onMouseLeave={() => setShowHardcoverTooltip(prev => ({ ...prev, [index]: false }))}
                                  >
                                    <button
                                      style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'help',
                                        padding: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                    >
                                      <img
                                        src="/hardcover_icon.png"
                                        alt="Hardcover"
                                        style={{
                                          width: '16px',
                                          height: '16px',
                                          objectFit: 'contain'
                                        }}
                                      />
                                    </button>
                                    {showHardcoverTooltip[index] && (
                                      <div
                                        style={{
                                          position: 'absolute',
                                          bottom: '100%',
                                          left: '50%',
                                          transform: 'translateX(-50%)',
                                          marginBottom: '0.5rem',
                                          width: '280px',
                                          background: '#f0f4ff',
                                          padding: '1rem',
                                          borderRadius: '8px',
                                          border: '1px solid #c7d2fe',
                                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                          zIndex: 1000,
                                          pointerEvents: 'none'
                                        }}
                                      >
                                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#667eea', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                          <img
                                            src="/hardcover_icon.png"
                                            alt="Hardcover"
                                            style={{
                                              width: '16px',
                                              height: '16px',
                                              objectFit: 'contain'
                                            }}
                                          />
                                          <span>Hardcover Sync</span>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#374151', lineHeight: '1.5' }}>
                                          Ratings are automatically synced to your Hardcover account. To disable syncing, unlink your account in Profile settings.
                                        </div>
                                        <div
                                          style={{
                                            position: 'absolute',
                                            bottom: '-6px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: 0,
                                            height: 0,
                                            borderLeft: '6px solid transparent',
                                            borderRight: '6px solid transparent',
                                            borderTop: '6px solid #c7d2fe'
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          {book.ratings && Object.keys(book.ratings).length > 0 && (
                            <>
                              {(getUserRating(book) > 0 || book.ratings) && (
                                <div className="rating-divider" />
                              )}
                              <div className="rating-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: '500', color: '#666' }}>
                                  Average:
                                </span>
                                <StarRating
                                  rating={calculateAverageRating(book.ratings)}
                                  readOnly={true}
                                  size="small"
                                />
                                <span style={{ 
                                  fontSize: '0.85rem', 
                                  color: '#666',
                                  marginLeft: '0.25rem'
                                }}>
                                  ({calculateAverageRating(book.ratings).toFixed(1)})
                                </span>
                                <span style={{ 
                                  fontSize: '0.75rem', 
                                  color: '#999',
                                  marginLeft: '0.5rem'
                                }}>
                                  ({Object.keys(book.ratings).length} rating{Object.keys(book.ratings).length !== 1 ? 's' : ''})
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Reviews Section */}
                    <div className="reviews-section-container" style={{ 
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      background: '#ffffff',
                      borderRadius: '6px',
                      border: '1px solid #e9ecef'
                    }}>
                      <style>{`
                        .reviews-section-container .reviews-header {
                          display: flex;
                          justify-content: space-between;
                          align-items: center;
                          margin-bottom: 0.5rem;
                        }
                        .reviews-section-container .reviews-header-buttons {
                          display: flex;
                          gap: 0.5rem;
                          align-items: center;
                        }
                        @media (max-width: 768px) {
                          .reviews-section-container {
                            padding: 0.5rem;
                          }
                          .reviews-section-container .reviews-header {
                            flex-direction: column;
                            align-items: flex-start;
                            gap: 0.75rem;
                          }
                          .reviews-section-container .reviews-header-buttons {
                            width: 100%;
                            flex-direction: column;
                            gap: 0.5rem;
                          }
                          .reviews-section-container .reviews-header-buttons button {
                            width: 100%;
                            padding: 0.5rem 0.75rem !important;
                            font-size: 0.8rem !important;
                          }
                        }
                      `}</style>
                      <div className="reviews-header">
                        <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#333' }}>
                          Reviews
                        </span>
                        {editingReviewIndex !== index && (
                          <div className="reviews-header-buttons">
                            {book.reviews?.[userId] && (
                              <button
                                onClick={() => handleDeleteReview(index)}
                                disabled={savingReviews[index]}
                                style={{
                                  padding: '0.25rem 0.5rem',
                                  fontSize: '0.75rem',
                                  fontWeight: '500',
                                  background: 'transparent',
                                  color: '#dc3545',
                                  border: '1px solid #dc3545',
                                  borderRadius: '4px',
                                  cursor: savingReviews[index] ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.2s',
                                  opacity: savingReviews[index] ? 0.6 : 1
                                }}
                                onMouseEnter={(e) => {
                                  if (!savingReviews[index]) {
                                    e.currentTarget.style.background = '#dc3545';
                                    e.currentTarget.style.color = 'white';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (!savingReviews[index]) {
                                    e.currentTarget.style.background = 'transparent';
                                    e.currentTarget.style.color = '#dc3545';
                                  }
                                }}
                              >
                                {savingReviews[index] ? 'Deleting...' : 'Delete Review'}
                              </button>
                            )}
                            <button
                              onClick={() => handleStartEditReview(index)}
                              style={{
                                padding: '0.25rem 0.5rem',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                background: 'transparent',
                                color: '#667eea',
                                border: '1px solid #667eea',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#667eea';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#667eea';
                              }}
                            >
                              {book.reviews?.[userId] ? 'Edit Review' : 'Write Review'}
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* User's own review editing */}
                      {editingReviewIndex === index && (
                        <div className="review-edit-container" style={{ marginBottom: '0.75rem', marginLeft: '0.5rem', marginRight: '0.5rem' }}>
                          <style>{`
                            .review-edit-container .review-edit-buttons {
                              display: flex;
                              gap: 0.5rem;
                              justify-content: space-between;
                              align-items: center;
                              margin-top: 0.5rem;
                            }
                            .review-edit-container .review-edit-buttons-right {
                              display: flex;
                              gap: 0.5rem;
                            }
                            @media (max-width: 768px) {
                              .review-edit-container {
                                margin-left: 0 !important;
                                margin-right: 0 !important;
                              }
                              .review-edit-container .review-edit-buttons {
                                flex-direction: column;
                                gap: 0.5rem;
                              }
                              .review-edit-container .review-edit-buttons-right {
                                width: 100%;
                                flex-direction: column;
                                gap: 0.5rem;
                              }
                              .review-edit-container .review-edit-buttons button {
                                width: 100%;
                              }
                            }
                          `}</style>
                          <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            placeholder="Share your thoughts about this book..."
                            style={{
                              width: '100%',
                              minHeight: '100px',
                              padding: '0.75rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              fontSize: '0.9rem',
                              fontFamily: 'inherit',
                              resize: 'vertical',
                              outline: 'none',
                              transition: 'border-color 0.2s',
                              boxSizing: 'border-box'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#667eea'}
                            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                          />
                          <div className="review-edit-buttons">
                            <button
                              onClick={() => handleDeleteReview(index)}
                              disabled={savingReviews[index]}
                              style={{
                                padding: '0.5rem 1rem',
                                fontSize: '0.85rem',
                                fontWeight: '500',
                                background: 'transparent',
                                color: '#dc3545',
                                border: '1px solid #dc3545',
                                borderRadius: '6px',
                                cursor: savingReviews[index] ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                opacity: savingReviews[index] ? 0.6 : 1
                              }}
                              onMouseEnter={(e) => {
                                if (!savingReviews[index]) {
                                  e.currentTarget.style.background = '#dc3545';
                                  e.currentTarget.style.color = 'white';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!savingReviews[index]) {
                                  e.currentTarget.style.background = 'transparent';
                                  e.currentTarget.style.color = '#dc3545';
                                }
                              }}
                            >
                              {savingReviews[index] ? 'Deleting...' : 'Delete Review'}
                            </button>
                            <div className="review-edit-buttons-right">
                              <button
                                onClick={() => {
                                  setEditingReviewIndex(null);
                                  setReviewText('');
                                }}
                                disabled={savingReviews[index]}
                                style={{
                                  padding: '0.5rem 1rem',
                                  fontSize: '0.85rem',
                                  fontWeight: '500',
                                  background: 'transparent',
                                  color: '#666',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  cursor: savingReviews[index] ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.2s',
                                  opacity: savingReviews[index] ? 0.6 : 1
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleReviewSave(index)}
                                disabled={savingReviews[index] || syncingReviewToHardcover[index]}
                                style={{
                                  padding: '0.5rem 1rem',
                                  fontSize: '0.85rem',
                                  fontWeight: '500',
                                  background: savingReviews[index] || syncingReviewToHardcover[index] 
                                    ? '#ccc' 
                                    : hardcoverReviewSyncSuccess[index]
                                    ? '#28a745'
                                    : '#667eea',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: savingReviews[index] || syncingReviewToHardcover[index] ? 'not-allowed' : 'pointer',
                                  transition: 'opacity 0.2s',
                                  opacity: savingReviews[index] || syncingReviewToHardcover[index] ? 0.7 : 1
                                }}
                              >
                                {savingReviews[index] 
                                  ? 'Saving...' 
                                  : syncingReviewToHardcover[index]
                                  ? 'Syncing to Hardcover...'
                                  : hardcoverReviewSyncSuccess[index]
                                  ? 'Syncing to Hardcover... Success!'
                                  : 'Save Review'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Display existing reviews */}
                      {book.reviews && Object.keys(book.reviews).length > 0 ? (
                        <div className="reviews-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <style>{`
                            .reviews-list .review-item {
                              padding: 0.75rem;
                              border-radius: 6px;
                            }
                            @media (max-width: 768px) {
                              .reviews-list .review-item {
                                padding: 0.625rem;
                              }
                              .reviews-list .review-item .review-text {
                                font-size: 0.85rem;
                                word-wrap: break-word;
                                overflow-wrap: break-word;
                              }
                            }
                          `}</style>
                          {Object.entries(book.reviews)
                            .filter(([reviewerId]) => editingReviewIndex !== index || reviewerId !== userId)
                            .map(([reviewerId, reviewText]) => (
                            <div 
                              key={reviewerId}
                              className="review-item"
                              style={{
                                padding: '0.75rem',
                                background: reviewerId === userId ? '#f0f4ff' : '#f8f9fa',
                                borderRadius: '6px',
                                border: reviewerId === userId ? '1px solid #667eea' : '1px solid #e9ecef'
                              }}
                            >
                              <div style={{ 
                                fontSize: '0.75rem', 
                                fontWeight: '600', 
                                color: '#667eea',
                                marginBottom: '0.25rem'
                              }}>
                                {reviewerId === userId ? 'Your Review' : getUserName(reviewerId)}
                              </div>
                              <div className="review-text" style={{ 
                                fontSize: '0.9rem', 
                                color: '#333',
                                lineHeight: '1.5',
                                whiteSpace: 'pre-wrap',
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word'
                              }}>
                                {reviewText}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ 
                          fontSize: '0.85rem', 
                          color: '#999', 
                          fontStyle: 'italic',
                          textAlign: 'center',
                          padding: '0.5rem'
                        }}>
                          No reviews yet. Be the first to share your thoughts!
                        </div>
                      )}
                    </div>
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
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1rem 1.5rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#333', margin: 0 }}>
              Next Book Voting
            </h4>
            <button
              onClick={() => setShowSubmissions(!showSubmissions)}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                fontWeight: '500',
                background: showSubmissions ? '#dc3545' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
              }}
            >
              {showSubmissions ? (
                <>
                  <span>Hide</span>
                  <span>▼</span>
                </>
              ) : (
                <>
                  <span>Show</span>
                  <span>▶</span>
                </>
              )}
            </button>
          </div>

          {showSubmissions && (
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
          onDelete={() => handleDeleteBook(editingBookIndex)}
        />
      )}
    </div>
  );
};

export default BooksTab;
