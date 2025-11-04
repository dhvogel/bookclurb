import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { Club } from '../../../../types';

interface ReadingProgressTrackerProps {
  club: Club;
  isAdmin: boolean;
  onSave: (currentPages: number, totalPages: number) => Promise<void>;
  onStartEdit?: () => void;
}

export interface ReadingProgressTrackerRef {
  startEditing: () => void;
}

const ReadingProgressTracker = forwardRef<ReadingProgressTrackerRef, ReadingProgressTrackerProps>(({
  club,
  isAdmin,
  onSave,
  onStartEdit
}, ref) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Determine if tracking by chapters or pages
  const isTrackingByChapters = (): boolean => {
    const schedule = club.currentBook?.schedule;
    if (schedule && schedule.length > 0) {
      // Check if schedule entries use chapters
      const hasChapters = schedule.some(e => e.chapter);
      const hasPages = schedule.some(e => e.pages);
      // If chapters exist and no pages, we're tracking by chapters
      if (hasChapters && !hasPages) {
        return true;
      }
    }
    // Check if totalChapters is set in progress
    const progress = club.currentBook?.progress as any;
    if (progress?.totalChapters !== undefined && !club.currentBook?.progress?.totalPages) {
      return true;
    }
    return false;
  };
  
  const trackingByChapters = isTrackingByChapters();
  
  // Helper to get total chapters if tracking by chapters
  const getTotalChapters = (): number | undefined => {
    const progress = club.currentBook?.progress as any;
    return progress?.totalChapters;
  };
  
  const totalChapters = trackingByChapters ? getTotalChapters() : undefined;
  
  // Helper to get total pages, with migration from old chapter format
  const getTotalPages = (): number => {
    // If tracking by chapters, use totalChapters converted to pages
    if (trackingByChapters && totalChapters) {
      return totalChapters * 12;
    }
    // Otherwise use totalPages if available
    if (club.currentBook?.progress?.totalPages !== undefined) {
      return club.currentBook.progress.totalPages;
    }
    // Migration: convert old chapter format to pages (assuming ~12 pages per chapter)
    const progress = club.currentBook?.progress as any;
    if (progress?.totalChapters !== undefined) {
      return progress.totalChapters * 12;
    }
    // Fall back to pageCount from Google Books API if available
    return club.currentBook?.pageCount || 300;
  };
  
  // Calculate progress based on schedule
  const getProgressFromSchedule = (): { currentPages: number; nextMeetingPages?: number; nextMeetingEntry?: { pages?: number; chapter?: number } } => {
    const schedule = club.currentBook?.schedule;
    
    // Convert meeting target to pages
    const convertToPages = (entry: { pages?: number; chapter?: number } | null): number => {
      if (!entry) return 0;
      if (entry.pages && entry.pages > 0) return entry.pages;
      if (entry.chapter) return entry.chapter * 12; // Estimate 12 pages per chapter
      return 0;
    };

    // Priority 1: Use saved currentPages if available (from manual edit or completed meeting)
    if (club.currentBook?.progress?.currentPages !== undefined) {
      const savedCurrentPages = club.currentBook.progress.currentPages;
      
      // Find the next meeting after the saved progress
      if (schedule && schedule.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let nextMeeting: { pages?: number; chapter?: number } | null = null;
        
        for (const entry of schedule) {
          const entryPages = convertToPages(entry);
          // Find the first meeting whose target is greater than current progress
          if (entryPages > savedCurrentPages && !nextMeeting) {
            nextMeeting = entry;
            break;
          }
        }
        
        // If no meeting found with target > currentPages, check for next future meeting by date
        if (!nextMeeting) {
          for (const entry of schedule) {
            const [year, month, day] = entry.date.split('-').map(Number);
            const entryDate = new Date(year, month - 1, day);
            entryDate.setHours(0, 0, 0, 0);
            
            if (entryDate >= today && !nextMeeting) {
              nextMeeting = entry;
              break;
            }
          }
        }
        
        const nextMeetingPages = nextMeeting ? convertToPages(nextMeeting) : undefined;
        return { currentPages: savedCurrentPages, nextMeetingPages, nextMeetingEntry: nextMeeting || undefined };
      }
      
      return { currentPages: savedCurrentPages };
    }
    
    // Migration: convert old chapter format to pages
    const progress = club.currentBook?.progress as any;
    if (progress?.currentChapter !== undefined) {
      const migratedPages = progress.currentChapter * 12;
      
      // Find next meeting after migrated pages
      if (schedule && schedule.length > 0) {
        let nextMeeting: { pages?: number; chapter?: number } | null = null;
        for (const entry of schedule) {
          const entryPages = convertToPages(entry);
          if (entryPages > migratedPages && !nextMeeting) {
            nextMeeting = entry;
            break;
          }
        }
        const nextMeetingPages = nextMeeting ? convertToPages(nextMeeting) : undefined;
        return { currentPages: migratedPages, nextMeetingPages, nextMeetingEntry: nextMeeting || undefined };
      }
      
      return { currentPages: migratedPages };
    }
    
    // No schedule, no saved progress
    if (!schedule || schedule.length === 0) {
      return { currentPages: 0 };
    }

    // Fallback: Find the most recent past meeting based on date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let mostRecentPast: { pages?: number; chapter?: number; date: string } | null = null;
    let mostRecentPastDate: Date | null = null;
    let nextMeeting: { pages?: number; chapter?: number } | null = null;

    for (const entry of schedule) {
      const [year, month, day] = entry.date.split('-').map(Number);
      const entryDate = new Date(year, month - 1, day);
      entryDate.setHours(0, 0, 0, 0);

      if (entryDate < today) {
        // Past meeting - use the most recent one
        if (!mostRecentPast || entryDate.getTime() > (mostRecentPastDate?.getTime() || 0)) {
          mostRecentPast = entry;
          mostRecentPastDate = entryDate;
        }
      } else if (entryDate >= today && !nextMeeting) {
        // Future meeting - use the first upcoming one
        nextMeeting = entry;
      }
    }

    const currentPages = convertToPages(mostRecentPast);
    const nextMeetingPages = nextMeeting ? convertToPages(nextMeeting) : undefined;

    return { currentPages, nextMeetingPages, nextMeetingEntry: nextMeeting || undefined };
  };

  const scheduleProgress = getProgressFromSchedule();
  const calculatedTotalPages = getTotalPages();
  
  const [currentPages, setCurrentPages] = useState<number>(scheduleProgress.currentPages);
  const [totalPages, setTotalPages] = useState<number>(calculatedTotalPages);
  const [nextMeetingPages, setNextMeetingPages] = useState<number | undefined>(scheduleProgress.nextMeetingPages);
  const [nextMeetingEntry, setNextMeetingEntry] = useState<{ pages?: number; chapter?: number } | undefined>(scheduleProgress.nextMeetingEntry);

  // Sync with club updates and schedule
  React.useEffect(() => {
    const progress = getProgressFromSchedule();
    const calculatedTotal = getTotalPages();
    setCurrentPages(progress.currentPages);
    setTotalPages(calculatedTotal);
    setNextMeetingPages(progress.nextMeetingPages);
    setNextMeetingEntry(progress.nextMeetingEntry);
  }, [club.currentBook?.schedule, club.currentBook?.progress?.currentPages, club.currentBook?.progress?.totalPages, club.currentBook?.progress, club.currentBook?.pageCount]);

  const progressPercentage = totalPages > 0
    ? Math.round((currentPages / totalPages) * 100)
    : 0;

  const progressPercentageForDisplay = Math.min(progressPercentage, 100);
  
  // Calculate next meeting progress percentage if applicable
  const nextMeetingPercentage = nextMeetingPages && totalPages > 0
    ? Math.round((nextMeetingPages / totalPages) * 100)
    : undefined;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(currentPages, totalPages);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save progress:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const progress = getProgressFromSchedule();
    setCurrentPages(progress.currentPages);
    setNextMeetingPages(progress.nextMeetingPages);
    setIsEditing(false);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    if (onStartEdit) {
      onStartEdit();
    }
  };

  useImperativeHandle(ref, () => ({
    startEditing: () => setIsEditing(true)
  }));

  if (!club.currentBook) return null;

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <span style={{ fontSize: '1rem', fontWeight: '600', color: '#333' }}>
          Progress
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
              Current Page
            </label>
            <input
              type="number"
              min="0"
              max={totalPages || 10000}
              value={currentPages}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (isNaN(value)) {
                  setCurrentPages(0);
                } else {
                  setCurrentPages(Math.max(0, Math.min(value, totalPages || 10000)));
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
              Total Pages
            </label>
            <input
              type="number"
              min="1"
              value={totalPages}
              onChange={(e) => {
                const total = Math.max(1, parseInt(e.target.value) || 1);
                setTotalPages(total);
                if (currentPages > total) {
                  setCurrentPages(total);
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
          {/* Progress Bar Container */}
          <div style={{ 
            position: 'relative',
            padding: '4px 0',
            marginBottom: '0.75rem'
          }}>
            {/* Progress Bar */}
            <div style={{
              width: '100%',
              height: '12px',
              backgroundColor: '#f0f0f5',
              borderRadius: '20px',
              overflow: 'visible',
              position: 'relative',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
            }}>
              {/* Completed pages */}
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
              
              {/* In Progress section (between current and next meeting) */}
              {nextMeetingPercentage !== undefined && nextMeetingPercentage > progressPercentageForDisplay && nextMeetingPercentage <= 100 && (
                <>
                  <div style={{
                    position: 'absolute',
                    left: `${progressPercentageForDisplay}%`,
                    width: `${Math.min(nextMeetingPercentage - progressPercentageForDisplay, 100 - progressPercentageForDisplay)}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, rgba(148, 163, 184, 0.25) 0%, rgba(148, 163, 184, 0.35) 50%, rgba(148, 163, 184, 0.25) 100%)',
                    backgroundSize: '200% 100%',
                    borderRadius: progressPercentageForDisplay === 0 ? '20px 0 0 20px' : '0',
                    zIndex: 7,
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
                    animation: 'subtlePulse 2s ease-in-out infinite'
                  }} />
                </>
              )}
            </div>
            
            {/* Current Progress Indicator */}
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
          
          {/* Page/Chapter Info */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.85rem',
            color: '#666',
            padding: '0 0.25rem'
          }}>
            <span style={{ fontWeight: '500', color: '#764ba2' }}>
              {trackingByChapters && totalChapters ? (
                currentPages > 0 ? (
                  <>Chapter {Math.ceil(currentPages / 12)}</>
                ) : (
                  <></>
                )
              ) : totalPages > 0 ? (
                currentPages > 0 ? (
                  <>Page {currentPages}</>
                ) : (
                  <></>
                )
              ) : (
                <>Progress: {progressPercentageForDisplay}%</>
              )}
            </span>
            {trackingByChapters && totalChapters ? (
              <span style={{ color: '#999' }}>
                of {totalChapters} chapters
              </span>
            ) : totalPages > 0 ? (
              <span style={{ color: '#999' }}>
                of {totalPages} pages
              </span>
            ) : null}
          </div>
        </>
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
        @keyframes subtlePulse {
          0%, 100% {
            background-position: 0% 50%;
            opacity: 1;
          }
          50% {
            background-position: 100% 50%;
            opacity: 0.95;
          }
        }
      `}</style>
    </div>
  );
});

ReadingProgressTracker.displayName = 'ReadingProgressTracker';

export default ReadingProgressTracker;
