import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { Database, ref, update } from 'firebase/database';
import { Club } from '../../../../types';

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
        {club.currentBook && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333', margin: 0 }}>
                Current Book
              </h3>
              {isAdmin && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Edit Progress
                </button>
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
            
            {/* Reading Progress Tracker - Full Width */}
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
    </div>
  );
};

export default OverviewTab;
