import React from 'react';
import { User } from 'firebase/auth';
import { Database, ref, set, onValue } from 'firebase/database';
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

  React.useEffect(() => {
    if (user) {
      const reflectionRef = ref(db, `reflections/${user.uid}`);
      onValue(reflectionRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setUserReflections(data);
        }
      });
    }
  }, [user, db]);

  // Modified handleSave to show "Saved" indicator
  const handleSave = (meetingId: string) => {
    if (!user) return;
    
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

    set(ref(db, `reflections/${user.uid}/${meetingId}`), {
      reflection: userReflections[meetingId]?.reflection || "",
      timestamp: Date.now(),
    }).then(() => {
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
      // Fetch user's from users/{userId}
      // Fetch all user IDs from users table and write notification for each
      const usersRef = ref(db, "users");
      onValue(
        usersRef,
        (usersSnapshot) => {
          const usersData = usersSnapshot.val() || {};
          const firstName = usersData[user.uid]?.first_name || "A user";
          Object.keys(usersData).forEach((userId) => {
            if (userId === user.uid) return; // Skip notifying oneself
            // Write notification to notifications/{userId}/{meetingId}
            set(ref(db, `notifications/${userId}/${meetingId}`), {
              text: `${firstName} has submitted a post.`,
              isRead: false,
              timestamp: Date.now(),
            });
          });
        },
        { onlyOnce: true }
      );
    });
  };

  // Helper function to fetch and log all user reflections for the meeting
  const fetchAllReflectionsForMeeting = (id: string) => {
    const reflectionsRef = ref(db, "reflections");
    onValue(
      reflectionsRef,
      (snapshot) => {
        const allReflections = snapshot.val() as Record<string, Record<string, { reflection: string }>>;
        const meetingReflections: Record<string, Record<string, { name: string; reflection: string }>> = {};
        if (allReflections) {
          Object.entries(allReflections).forEach(([uid, meetings]) => {
            if (meetings && meetings[id] && meetings[id].reflection) {
              // Fetch user's first_name and last_name from users/${uid}
              const userRef = ref(db, `users/${uid}`);
              onValue(
                userRef,
                (userSnapshot) => {
                  const userData = userSnapshot.val();
                  const name = userData
                    ? `${userData.first_name || ""} ${
                        userData.last_name || ""
                      }`.trim()
                    : uid;
                  meetingReflections[id] = meetingReflections[id] || {};
                  meetingReflections[id][uid] = {
                    name,
                    reflection: meetings[id].reflection,
                  };
                  // Update state after each user fetch
                  setAllReflectionsForMeeting((prev) => ({
                    ...prev,
                    ...meetingReflections,
                  }));
                },
                { onlyOnce: true }
              );
            }
          });
        }
        setMeetingId(id);
        setAllReflectionsForMeeting(meetingReflections);
        setShowModal(true);
      },
      { onlyOnce: true }
    );
  };

  // Array of meetings - this could be made dynamic based on club data
  const meetings: Array<{ id: string; time: string; reading: string; date: string; status: 'upcoming' | 'past' | 'current' }> = [
    {
      id: "meeting-2025-10-30",
      time: "Thu, 10/30, 6:00 PM EDT",
      reading: "Empire of Pain, Ch 26-End",
      date: "2025-10-30",
      status: 'current'
    },
    {
      id: "meeting-2025-10-23",
      time: "Thu, 10/23, 6:00 PM EDT",
      reading: "Empire of Pain, Ch 21-25",
      date: "2025-10-23",
      status: 'past'
    },
    {
      id: "meeting-2025-10-16",
      time: "Thu, 10/16, 6:00 PM EDT",
      reading: "Empire of Pain, Ch 15-20",
      date: "2025-10-16",
      status: 'past'
    },
    {
      id: "meeting-2025-10-09",
      time: "Thu, 10/9, 6:00 PM EDT",
      reading: "Empire of Pain, Ch 11-14",
      date: "2025-10-09",
      status: 'past'
    },
    {
      id: "meeting-2025-10-02",
      time: "Thu, 10/2, 6:00 PM EDT",
      reading: "Empire of Pain, Ch 8-10",
      date: "2025-10-02",
      status: 'past'
    },
    {
      id: "meeting-2025-09-25",
      time: "Thu, 9/25, 6:00 PM EDT",
      reading: "Empire of Pain, Ch 4-7",
      date: "2025-09-25",
      status: 'past'
    },
    {
      id: "meeting-2025-09-18",
      time: "Thu, 9/18, 6:00 PM EDT",
      reading: "Empire of Pain, Ch 1-3",
      date: "2025-09-18",
      status: 'past'
    },
  ];

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
      case 'current': return '🔥';
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
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
        
        {/* Quick Stats */}
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ 
            background: '#f8f9fa', 
            padding: '0.75rem 1rem', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '1.2rem' }}>📚</span>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>
              {meetings.length} meetings scheduled
            </span>
          </div>
          <div style={{ 
            background: '#f8f9fa', 
            padding: '0.75rem 1rem', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{ fontSize: '1.2rem' }}>✍️</span>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>
              {Object.keys(userReflections).length} reflections written
            </span>
          </div>
        </div>
      </div>

      {/* Meetings Grid */}
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        {meetings.map((meeting) => {
          const hasReflection = userReflections[meeting.id]?.reflection;
          const isExpanded = expandedMeeting === meeting.id;
          
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
                  {hasReflection && (
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
                <div style={{ 
                  borderTop: '1px solid #e5e7eb', 
                  paddingTop: '1.5rem',
                  animation: 'fadeIn 0.3s ease'
                }}>
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
                        outline: 'none'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
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