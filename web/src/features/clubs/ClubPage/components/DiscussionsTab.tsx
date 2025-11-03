import React from 'react';
import { User } from 'firebase/auth';
import { Database, ref, set, onValue, update } from 'firebase/database';
import ReflectionModal from '../../../../components/ReflectionModal';
import { Club } from '../../../../types';

interface DiscussionsTabProps {
  club: Club;
  user: User | null;
  db: Database;
}

const DiscussionsTab: React.FC<DiscussionsTabProps> = ({ club, user, db }) => {
  const [userReflections, setUserReflections] = React.useState<Record<string, { reflection: string }>>({});
  const [allReflectionsForMeeting, setAllReflectionsForMeeting] =
    React.useState<Record<string, Record<string, { name: string; reflection: string }>>>({});
  const [showModal, setShowModal] = React.useState<boolean>(false);
  const [meetingId, setMeetingId] = React.useState<string>("");
  const [lastSaveTime, setLastSaveTime] = React.useState<number>(0);
  const [saved, setSaved] = React.useState<boolean>(false);
  const [expandedMeeting, setExpandedMeeting] = React.useState<string | null>(null);
  const [savedReflections, setSavedReflections] = React.useState<Set<string>>(new Set());
  const [collapsedMeetings, setCollapsedMeetings] = React.useState<Set<string>>(new Set());
  const [archiving, setArchiving] = React.useState<boolean>(false);

  // Check if current user is an admin
  const isAdmin = user && club.members?.some(
    member => member.id === user.uid && member.role === 'admin'
  );

  // Load user reflections from club.meetings structure
  React.useEffect(() => {
    if (user && club?.meetings) {
      const userReflectionsMap: Record<string, { reflection: string }> = {};
      const savedMeetingIds = new Set<string>();
      
      club.meetings.forEach(meeting => {
        if (meeting.reflections) {
          const userReflection = meeting.reflections.find(r => r.userId === user.uid);
          if (userReflection) {
            userReflectionsMap[meeting.id] = { reflection: userReflection.reflection };
            savedMeetingIds.add(meeting.id);
          }
        }
      });
      
      setUserReflections(userReflectionsMap);
      setSavedReflections(savedMeetingIds);
    }
  }, [user, club]);

  // Modified handleSave to save to club.meetings structure
  const handleSave = (meetingId: string) => {
    if (!user || !club) return;
    
    if (lastSaveTime && Date.now() - lastSaveTime < 15000) {
      const secondsLeft = Math.ceil(
        (15000 - (Date.now() - lastSaveTime)) / 1000
      );
      alert(
        `Please wait ${secondsLeft} more second${
          secondsLeft !== 1 ? "s" : ""
        } before saving again.`
      );
      return;
    }
    setLastSaveTime(Date.now());

    // Find the meeting in club.meetings
    const meetingIndex = club.meetings?.findIndex(m => m.id === meetingId);
    if (meetingIndex === undefined || meetingIndex === -1) {
      console.error(`Meeting ${meetingId} not found in club.meetings`);
      return;
    }

    // Get user name from club members data
    const clubMember = club.members?.find(member => member && member.id === user.uid);
    const userName = clubMember?.name || user.displayName || 'User';
    
    // Create or update the reflection
    const newReflection = {
      userId: user.uid,
      userName: userName,
      reflection: userReflections[meetingId]?.reflection || "",
      timestamp: Date.now(),
    };

    // Update the club.meetings structure
    const updatedMeetings = [...(club.meetings || [])];
    const meeting = updatedMeetings[meetingIndex];
    
    if (!meeting.reflections) {
      meeting.reflections = [];
    }
    
    // Remove existing reflection from this user if it exists
    meeting.reflections = meeting.reflections.filter(r => r.userId !== user.uid);
    
    // Add the new reflection
    meeting.reflections.push(newReflection);

    // Save to Firebase
    const clubRef = ref(db, `clubs/${club.id}`);
    update(clubRef, {
      meetings: updatedMeetings
    }).then(() => {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      
      // Add this meeting to the saved reflections set
      setSavedReflections(prev => new Set(prev).add(meetingId));
    }).catch((error) => {
      console.error('Error saving reflection:', error);
      alert('Failed to save reflection. Please try again.');
    });
  };

  // Helper function to get all reflections for a meeting from club.meetings structure
  const fetchAllReflectionsForMeeting = (id: string) => {
    if (!club?.meetings) {
      console.error('No meetings found in club data');
      return;
    }

    const meeting = club.meetings.find(m => m.id === id);
    if (!meeting || !meeting.reflections) {
      setAllReflectionsForMeeting({});
      setMeetingId(id);
      setShowModal(true);
      return;
    }

    // Convert reflections to the format expected by ReflectionModal
    const meetingReflections: Record<string, Record<string, { name: string; reflection: string }>> = {};
    meetingReflections[id] = {};
    
    meeting.reflections.forEach(reflection => {
      meetingReflections[id][reflection.userId] = {
        name: reflection.userName,
        reflection: reflection.reflection,
      };
    });

    setMeetingId(id);
    setAllReflectionsForMeeting(meetingReflections);
    setShowModal(true);
  };

  // Function to archive reflections for old book and create new ones for new book
  const handleArchiveAndCreateNew = async () => {
    if (!isAdmin || !club.currentBook) {
      alert('Only admins can perform this action, and a current book must be set.');
      return;
    }

    const newBook = club.onDeckBook;
    if (!newBook) {
      alert('Please set an "On Deck" book before archiving reflections. The new book will use the On Deck book.');
      return;
    }

    if (!window.confirm(`Archive reflections for "${club.currentBook.title}" and create new meetings for "${newBook.title}"? This action cannot be undone.`)) {
      return;
    }

    setArchiving(true);
    try {
      const currentBookTitle = club.currentBook.title;
      const updatedMeetings = [...(club.meetings || [])];

      // Find and archive reflections for meetings matching the old book
      updatedMeetings.forEach(meeting => {
        if (meeting.reading === currentBookTitle && meeting.reflections && meeting.reflections.length > 0) {
          // Archive reflections by moving them to archivedReflections and clearing reflections
          meeting.archivedReflections = meeting.reflections;
          meeting.reflections = [];
        }
      });

      // Create new meetings for the new book
      // Create a default meeting for the new book
      const newMeetingId = `meeting_${Date.now()}`;
      const newMeeting = {
        id: newMeetingId,
        time: club.nextMeeting?.timestamp 
          ? new Date(club.nextMeeting.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          : 'TBD',
        reading: newBook.title,
        date: club.nextMeeting?.timestamp
          ? new Date(club.nextMeeting.timestamp).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        status: 'upcoming' as const,
        reflections: [] as Array<{
          userId: string;
          userName: string;
          reflection: string;
          timestamp: number;
        }>
      };

      updatedMeetings.push(newMeeting);

      // Save to Firebase
      const clubRef = ref(db, `clubs/${club.id}`);
      await update(clubRef, {
        meetings: updatedMeetings
      });

      alert(`Successfully archived reflections for "${currentBookTitle}" and created a new meeting for "${newBook.title}".`);
    } catch (error) {
      console.error('Error archiving reflections:', error);
      alert('Failed to archive reflections and create new meetings. Please try again.');
    } finally {
      setArchiving(false);
    }
  };

  // Use meetings from club data, fallback to empty array if not available
  const meetings = club?.meetings || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return '#3b82f6';
      case 'current': return '#f59e0b';
      case 'past': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return '📅';
      case 'current': return '⚡';
      case 'past': return '✅';
      default: return '📅';
    }
  };

  if (!user) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#333' }}>
          Meeting Discussions
        </h3>
        <div
          style={{
            width: '100%',
            padding: '3rem',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            color: '#6c757d',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '200px',
            border: '2px dashed #dee2e6',
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
          <p style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', textAlign: 'center' }}>
            Please log in to participate in meeting discussions
          </p>
          <p style={{ fontSize: '0.9rem', opacity: 0.8, textAlign: 'center' }}>
            Share your thoughts and reflections on our book club meetings
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header Section */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '0.75rem',
            borderRadius: '12px',
            fontSize: '1.5rem'
          }}>
            💬
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.25rem', color: '#333' }}>
              Meeting Discussions
            </h3>
            <p style={{ color: '#666', fontSize: '0.95rem' }}>
              Share your thoughts and reflections on our book club meetings
            </p>
          </div>
        </div>
      </div>

      {/* Meetings Grid */}
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {meetings.map((meeting) => {
          const hasReflection = userReflections[meeting.id]?.reflection;
          const isSaved = savedReflections.has(meeting.id);
          const isExpanded = expandedMeeting === meeting.id || meeting.status === 'upcoming';
          
          return (
            <div
              key={meeting.id}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                border: meeting.status === 'current' ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onClick={() => setExpandedMeeting(isExpanded ? null : meeting.id)}
            >
              {/* Meeting Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ 
                    background: getStatusColor(meeting.status),
                    color: 'white',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    fontSize: '1.2rem'
                  }}>
                    {getStatusIcon(meeting.status)}
                  </div>
                  <div>
                    <h4 style={{ 
                      fontSize: '1.1rem', 
                      fontWeight: 'bold', 
                      marginBottom: '0.25rem', 
                      color: '#333' 
                    }}>
                      {meeting.reading}
                    </h4>
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>
                      {meeting.time}
                    </p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {isSaved && (
                    <div style={{ 
                      background: '#dcfce7',
                      color: '#166534',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: '500'
                    }}>
                      ✓ Reflection saved
                    </div>
                  )}
                  <div style={{ 
                    color: '#9ca3af',
                    fontSize: '1.2rem',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}>
                    ▼
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div 
                  style={{ 
                    borderTop: '1px solid #e5e7eb', 
                    paddingTop: '1.5rem',
                    animation: 'fadeIn 0.3s ease'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Reflection Input */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '0.9rem', 
                      fontWeight: '600', 
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Your Reflection
                    </label>
                    <textarea
                      style={{ 
                        width: 'calc(100% - 2rem)',
                        minHeight: '120px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '1rem',
                        fontSize: '0.9rem',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        transition: 'border-color 0.2s ease',
                        outline: 'none',
                        whiteSpace: 'pre-wrap'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                      onClick={(e) => e.stopPropagation()}
                      placeholder="Share your thoughts about this week's reading..."
                      value={userReflections[meeting.id]?.reflection || ""}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setUserReflections((prev) => ({
                          ...prev,
                          [meeting.id]: { reflection: e.target.value },
                        }))
                      }
                    />
                    
                    {/* Action Buttons */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginTop: '1rem'
                    }}>
                      <button
                        type="button"
                        style={{
                          background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)';
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSave(meeting.id);
                        }}
                      >
                        {saved ? '✓ Saved!' : 'Save Reflection'}
                      </button>
                      
                      <button
                        type="button"
                        style={{
                          background: '#f3f4f6',
                          color: '#374151',
                          padding: '0.75rem 1.5rem',
                          borderRadius: '8px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          transition: 'background-color 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = '#e5e7eb'}
                        onMouseOut={(e) => e.currentTarget.style.background = '#f3f4f6'}
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchAllReflectionsForMeeting(meeting.id);
                        }}
                      >
                        <span>👥</span>
                        View All Reflections
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Admin Archive Button - Bottom of Page */}
      {isAdmin && club.currentBook && (
        <div style={{
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <button
            type="button"
            style={{
              background: 'transparent',
              color: '#6b7280',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
              cursor: archiving ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              fontWeight: '400',
              transition: 'all 0.2s ease',
              opacity: archiving ? 0.5 : 1,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
            disabled={archiving}
            onMouseOver={(e) => {
              if (!archiving) {
                e.currentTarget.style.borderColor = '#d1d5db';
                e.currentTarget.style.color = '#374151';
                e.currentTarget.style.background = '#f9fafb';
              }
            }}
            onMouseOut={(e) => {
              if (!archiving) {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.color = '#6b7280';
                e.currentTarget.style.background = 'transparent';
              }
            }}
            onClick={handleArchiveAndCreateNew}
          >
            <span style={{ fontSize: '0.75rem' }}>{archiving ? '⏳' : '📦'}</span>
            <span>{archiving ? 'Archiving...' : 'Archive reflections for old book & start new'}</span>
          </button>
        </div>
      )}
      
      {showModal && (
        <ReflectionModal
          allReflections={allReflectionsForMeeting}
          meetingId={meetingId}
          setShowModal={setShowModal}
        />
      )}
    </div>
  );
};

export default DiscussionsTab;