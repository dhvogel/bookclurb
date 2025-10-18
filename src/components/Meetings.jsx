import React from "react";
import HeaderBar from "./HeaderBar";
import { ref, set, onValue } from "firebase/database";
import ReflectionModal from "./ReflectionModal";
import "../App.css";

const Meetings = ({ user, db }) => {
  const [userReflections, setUserReflections] = React.useState("");
  const [allReflectionsForMeeting, setAllReflectionsForMeeting] =
    React.useState({});
  const [showModal, setShowModal] = React.useState(false);
  const [meetingId, setMeetingId] = React.useState("");
  const [lastSaveTime, setLastSaveTime] = React.useState(0);

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

  const [saved, setSaved] = React.useState(false);

  // Modified handleSave to show "Saved" indicator
  const handleSave = (meetingId) => {
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
  const fetchAllReflectionsForMeeting = (id) => {
    const reflectionsRef = ref(db, "reflections");
    onValue(
      reflectionsRef,
      (snapshot) => {
        const allReflections = snapshot.val();
        const meetingReflections = {};
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

  // Array of meetings
  const meetings = [
    // Add more meetings here as needed
    {
      id: "meeting-2025-10-23",
      time: "Thu, 10/23, 6:00 PM EDT",
      reading: "Empire of Pain, Ch 21-25",
    },
    {
      id: "meeting-2025-10-16",
      time: "Thu, 10/16, 6:00 PM EDT",
      reading: "Empire of Pain, Ch 15-20",
    },
    {
      id: "meeting-2025-10-09",
      time: "Thu, 10/9, 6:00 PM EDT",
      reading: "Empire of Pain, Ch 11-14",
    },
    {
      id: "meeting-2025-10-02",
      time: "Thu, 10/2, 6:00 PM EDT",
      reading: "Empire of Pain, Ch 8-10",
    },
    {
      id: "meeting-2025-09-25",
      time: "Thu, 9/25, 6:00 PM EDT",
      reading: "Empire of Pain, Ch 4-7",
    },
    {
      id: "meeting-2025-09-18",
      time: "Thu, 9/18, 6:00 PM EDT",
      reading: "Empire of Pain, Ch 1-3",
    },
  ];

  return (
    <div>
      <HeaderBar user={user} db={db} />
      <div className="p-4" style={{ marginTop: "100px" }}>
        <h2 className="text-2xl font-bold mb-4">Upcoming Meetings</h2>
        {user ? (
          <table className="meetings-table w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">
                  Meeting Time
                </th>
                <th className="border border-gray-300 p-2 text-left">
                  Reading
                </th>
                <th className="border border-gray-300 p-2 text-left">
                  Reflection
                </th>
                <th className="border border-gray-300 p-2 text-left">
                  Other Members' Reflections
                </th>
              </tr>
            </thead>
            <tbody>
              {meetings.map((meeting) => (
                <tr key={meeting.id}>
                  <td className="border border-gray-300 p-2">{meeting.time}</td>
                  <td className="border border-gray-300 p-2">
                    {meeting.reading}
                  </td>
                  <td className="border border-gray-300 p-2">
                    <>
                      <textarea
                        className="border rounded p-2"
                        style={{ width: "100%", minWidth: "400px" }}
                        rows={6}
                        placeholder="Enter your reflection..."
                        value={userReflections[meeting.id]?.reflection || ""}
                        onChange={(e) =>
                          setUserReflections((prev) => ({
                            ...prev,
                            [meeting.id]: { reflection: e.target.value },
                          }))
                        }
                      />
                      <div className="mt-4 flex items-center justify-end">
                        <button
                          type="button"
                          className="bg-gray-200 text-gray-700 px-4 py-2 rounded mr-2 hover:bg-gray-300 transition"
                          onClick={() => handleSave(meeting.id)}
                        >
                          Save
                        </button>
                        {saved && (
                          <span className="saved-indicator">
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 20 20"
                              fill="none"
                            >
                              <circle cx="10" cy="10" r="10" fill="#22c55e" />
                              <path
                                d="M6 10.5l2.5 2.5 5-5"
                                stroke="#fff"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <p style={{ marginLeft: "6px" }}>
                              Reflection Saved
                            </p>
                          </span>
                        )}
                      </div>
                    </>
                  </td>
                  <td className="border border-gray-300 p-2 center-cell">
                    <button
                      type="button"
                      className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded hover:bg-indigo-200 transition"
                      onClick={() => fetchAllReflectionsForMeeting(meeting.id)}
                    >
                      Show Reflections
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div
            className="w-full p-8 rounded bg-gray-100 text-gray-400 flex flex-col items-center justify-center"
            style={{
              border: "2px solid #e5e7eb",
              minHeight: "200px",
              opacity: 0.7,
            }}
          >
            <p className="text-lg font-semibold mb-2">
              Please log in to view meeting details.
            </p>
          </div>
        )}
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

export default Meetings;
