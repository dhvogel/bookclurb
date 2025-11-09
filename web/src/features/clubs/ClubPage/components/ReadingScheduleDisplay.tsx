import React from 'react';
import { Club } from '../../../../types';

interface ReadingScheduleDisplayProps {
  club: Club;
  isAdmin: boolean;
  onMarkCompleted: (entryIndex: number, pages?: number, chapter?: number, isUnmarking?: boolean) => Promise<void>;
  onOpenScheduleModal?: () => void;
}

const ReadingScheduleDisplay: React.FC<ReadingScheduleDisplayProps> = ({ club, isAdmin, onMarkCompleted, onOpenScheduleModal }) => {
  const [markingIndices, setMarkingIndices] = React.useState<Set<number>>(new Set());
  const [showTooltip, setShowTooltip] = React.useState(false);

  const hasSchedule = club.currentBook?.schedule && club.currentBook.schedule.length > 0;

  const handleMarkCompleted = async (index: number, pages?: number, chapter?: number, isUnmarking: boolean = false) => {
    setMarkingIndices(prev => new Set(prev).add(index));
    try {
      await onMarkCompleted(index, pages, chapter, isUnmarking);
    } catch (error) {
      console.error('Failed to mark meeting as completed:', error);
    } finally {
      setMarkingIndices(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1rem'
      }}>
        <h4 style={{ 
          fontSize: '1rem', 
          fontWeight: '600', 
          color: '#333',
          margin: 0
        }}>
          📅 Reading Schedule
        </h4>
        {isAdmin && onOpenScheduleModal && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
            <button
              onClick={onOpenScheduleModal}
              style={{
                padding: hasSchedule ? '0.25rem 0.5rem' : '0.5rem 1rem',
                fontSize: hasSchedule ? '0.7rem' : '0.85rem',
                fontWeight: hasSchedule ? '400' : '500',
                background: hasSchedule ? 'transparent' : '#667eea',
                color: hasSchedule ? '#999' : 'white',
                border: hasSchedule ? '1px solid transparent' : 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                opacity: hasSchedule ? 0.7 : 1,
                boxShadow: hasSchedule ? 'none' : '0 2px 4px rgba(102, 126, 234, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (hasSchedule) {
                  e.currentTarget.style.color = '#666';
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.borderColor = '#e0e0e0';
                  e.currentTarget.style.background = '#f8f9fa';
                } else {
                  e.currentTarget.style.background = '#5568d3';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (hasSchedule) {
                  e.currentTarget.style.color = '#999';
                  e.currentTarget.style.opacity = '0.7';
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.background = 'transparent';
                } else {
                  e.currentTarget.style.background = '#667eea';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(102, 126, 234, 0.3)';
                }
              }}
            >
              Set Reading Schedule
            </button>
            <div
              style={{
                position: 'relative',
                display: 'inline-block'
              }}
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <button
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '1px solid #667eea',
                  background: '#f0f4ff',
                  color: '#667eea',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  padding: 0,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#667eea';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f0f4ff';
                  e.currentTarget.style.color = '#667eea';
                }}
              >
                i
              </button>
              {showTooltip && (
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
                    <span>💡</span>
                    <span>What is a reading schedule?</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#374151', lineHeight: '1.5' }}>
                    Set reading goals for each meeting to keep everyone on track. Members can see what to read by when, and you can track progress as meetings are completed.
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
          </div>
        )}
      </div>
      {hasSchedule && club.currentBook?.schedule ? (
        <div style={{
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '1rem',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {club.currentBook.schedule.map((entry, index) => {
            // Parse date string as local date to avoid timezone issues
            const [year, month, day] = entry.date.split('-').map(Number);
            const entryDate = new Date(year, month - 1, day);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            entryDate.setHours(0, 0, 0, 0);
            const isPast = entryDate < today;
            const isToday = entryDate.getTime() === today.getTime();
            
            const pages = entry.pages;
            const chapter = entry.chapter;
            
            // Check if this entry is completed by comparing current progress to entry target
            const currentProgress = club.currentBook?.progress;
            const currentPages = currentProgress?.currentPages ?? 0;
            let isCompleted = false;
            if (pages && pages > 0) {
              isCompleted = currentPages >= pages;
            } else if (chapter) {
              // If only chapter is set, estimate pages (12 per chapter)
              const estimatedPages = chapter * 12;
              isCompleted = currentPages >= estimatedPages;
            }
            
            // Determine display text based on what's set
            let displayText = '';
            if (pages && pages > 0) {
              displayText = `Read through page ${pages}`;
              if (chapter) {
                displayText += ` (through chapter ${chapter})`;
              }
            } else if (chapter) {
              displayText = `Through Chapter ${chapter}`;
            } else {
              displayText = 'No reading target set';
            }
            
            const markingCompleted = markingIndices.has(index);
            
            return (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  background: isCompleted ? '#dcfce7' : isToday ? '#e0f2fe' : isPast ? '#f1f5f9' : 'white',
                  borderRadius: '6px',
                  border: isCompleted ? '2px solid #22c55e' : isToday ? '2px solid #667eea' : '1px solid #e1e5e9',
                  transition: 'all 0.2s'
                }}
              >
                <div>
                  <div style={{ 
                    fontSize: '0.85rem', 
                    color: '#666',
                    marginBottom: '0.25rem'
                  }}>
                    {entryDate.toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  <div style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: '600',
                    color: isCompleted ? '#16a34a' : isToday ? '#667eea' : '#333'
                  }}>
                    {displayText}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {isCompleted ? (
                    isAdmin ? (
                      <button
                        onClick={() => handleMarkCompleted(index, pages, chapter, true)}
                        disabled={markingCompleted}
                        style={{
                          padding: '0.25rem 0.5rem',
                          background: '#22c55e',
                          color: 'white',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          cursor: markingCompleted ? 'not-allowed' : 'pointer',
                          opacity: markingCompleted ? 0.6 : 1,
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!markingCompleted) {
                            e.currentTarget.style.background = '#16a34a';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = '#22c55e';
                        }}
                      >
                        ✓ Completed
                      </button>
                    ) : (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: '#22c55e',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        ✓ Completed
                      </span>
                    )
                  ) : (
                    <>
                      {isToday && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: '#667eea',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          Today
                        </span>
                      )}
                      {isPast && !isToday && (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          background: '#94a3b8',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          Past
                        </span>
                      )}
                      {isAdmin && !isCompleted && (pages || chapter) && (
                        <button
                          onClick={() => handleMarkCompleted(index, pages, chapter)}
                          disabled={markingCompleted}
                          style={{
                            padding: '0.3rem 0.5rem',
                            fontSize: '0.7rem',
                            fontWeight: '500',
                            background: markingCompleted ? '#e0e0e0' : '#f0f0f0',
                            color: markingCompleted ? '#999' : '#666',
                            border: '1px solid #e0e0e0',
                            borderRadius: '4px',
                            cursor: markingCompleted ? 'not-allowed' : 'pointer',
                            opacity: markingCompleted ? 0.6 : 1,
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            if (!markingCompleted) {
                              e.currentTarget.style.background = '#e0e0e0';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!markingCompleted) {
                              e.currentTarget.style.background = '#f0f0f0';
                            }
                          }}
                        >
                          {markingCompleted ? 'Marking...' : 'Mark Complete'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      ) : (
        <div style={{
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '1.5rem',
          textAlign: 'center',
          color: '#666'
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            No reading schedule set yet.{isAdmin && onOpenScheduleModal && ' Click "Set Reading Schedule" to create one.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ReadingScheduleDisplay;
