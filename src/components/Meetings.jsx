import React from 'react';
import HeaderBar from './HeaderBar';
import { ref, set, onValue } from 'firebase/database';


const Meetings = ({ user, db }) => {

    const [reflection, setReflection] = React.useState("");
    const [allReflections, setAllReflections] = React.useState({});
    const [showModal, setShowModal] = React.useState(false);

    React.useEffect(() => {
        if (user) {
            const reflectionRef = ref(db, `reflections/${user.uid}/meeting-2024-09-18`);
            onValue(reflectionRef, (snapshot) => {
                const data = snapshot.val();
                if (data && data.reflection) {
                    setReflection(data.reflection);
                }
            });
        }
    }, [user, db]);

    const [saved, setSaved] = React.useState(false);

    // Modified handleSave to show "Saved" indicator
    const handleSave = () => {
        set(ref(db, `reflections/${user.uid}/meeting-2024-09-18`), {
            reflection,
            timestamp: Date.now()
        }).then(() => {
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
        });
    };

    // Helper function to fetch and log all user reflections for the meeting
    const fetchAllReflections = () => {
        const reflectionsRef = ref(db, 'reflections');
        onValue(reflectionsRef, (snapshot) => {
            const allReflections = snapshot.val();
            const meetingReflections = {};
            if (allReflections) {
                Object.entries(allReflections).forEach(([uid, meetings]) => {
                    if (
                        meetings &&
                        meetings['meeting-2024-09-18'] &&
                        meetings['meeting-2024-09-18'].reflection
                    ) {
                        // Fetch user's first_name and last_name from users/${uid}
                        const userRef = ref(db, `users/${uid}`);
                        onValue(userRef, (userSnapshot) => {
                            const userData = userSnapshot.val();
                            const name = userData
                                ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim()
                                : uid;
                            meetingReflections[uid] = {
                                name,
                                reflection: meetings['meeting-2024-09-18'].reflection
                            };
                            // Update state after each user fetch
                            setAllReflections(prev => ({ ...prev, ...meetingReflections }));
                        }, { onlyOnce: true });
                    }
                });
            }
            setAllReflections(meetingReflections);
            setShowModal(true);
        }, { onlyOnce: true });
    };

    return (
        <div>
            <HeaderBar user={user} />
            <div className="p-4" style={{marginTop: '100px'}}>
                <h2 className="text-2xl font-bold mb-4">Upcoming Meetings</h2>
                {/* Improved table styling */}
                <style>
                    {`
                        .meetings-table {
                            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
                            border-radius: 12px;
                            overflow: hidden;
                            background: #fff;
                        }
                        .meetings-table th, .meetings-table td {
                            transition: background 0.2s;
                            padding-left: 24px !important;
                            padding-right: 24px !important;
                        }
                        .meetings-table tbody tr:hover {
                            background: #f3f4f6;
                        }
                        .meetings-table th {
                            background: #f9fafb;
                            font-weight: 600;
                            color: #374151;
                        }
                        .meetings-table textarea {
                            background: #f9fafb;
                            border: 1px solid #e5e7eb;
                            transition: border 0.2s;
                        }
                        .meetings-table textarea:focus {
                            border: 1.5px solid #6366f1;
                            outline: none;
                            background: #fff;
                        }
                        .saved-indicator {
                            display: inline-flex;
                            align-items: center;
                            color: #22c55e;
                            font-weight: 500;
                            margin-left: 8px;
                            font-size: 1rem;
                        }
                        .center-cell {
                            text-align: center;
                        }
                        .modal-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100vw;
                            height: 100vh;
                            background: rgba(0,0,0,0.3);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            z-index: 1000;
                        }
                        .modal-content {
                            background: #fff;
                            border-radius: 12px;
                            box-shadow: 0 8px 32px rgba(0,0,0,0.18);
                            padding: 32px 24px;
                            min-width: 340px;
                            max-width: 90vw;
                        }
                        .modal-close-btn {
                            background: #f3f4f6;
                            color: #374151;
                            border: none;
                            border-radius: 6px;
                            padding: 8px 16px;
                            font-weight: 500;
                            cursor: pointer;
                            margin-top: 24px;
                        }
                        .modal-close-btn:hover {
                            background: #e5e7eb;
                        }
                        .reflection-list {
                            margin-top: 12px;
                        }
                        .reflection-item {
                            margin-bottom: 16px;
                            padding-bottom: 12px;
                            border-bottom: 1px solid #f3f4f6;
                        }
                        .reflection-uid {
                            font-size: 0.95rem;
                            color: #6366f1;
                            font-weight: 500;
                        }
                        .reflection-text {
                            margin-top: 4px;
                            font-size: 1rem;
                            color: #374151;
                        }
                    `}
                </style>
                <table className="meetings-table w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-2 text-left">Meeting Time</th>
                            <th className="border border-gray-300 p-2 text-left">Reading</th>
                            <th className="border border-gray-300 p-2 text-left">Reflection</th>
                            <th className="border border-gray-300 p-2 text-left">Other Members' Reflections</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border border-gray-300 p-2">Thu, 9/18, 6:00 PM EDT</td>
                            <td className="border border-gray-300 p-2">Empire of Pain, Ch 1-3</td>
                            <td className="border border-gray-300 p-2">
                                <textarea
                                    className="border rounded p-2"
                                    style={{ width: '100%', minWidth: '400px' }}
                                    rows={6}
                                    placeholder="Enter your reflection..."
                                    value={reflection}
                                    onChange={e => setReflection(e.target.value)}
                                />
                                <div className="mt-4 flex items-center justify-end">
                                    <button
                                        type="button"
                                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded mr-2 hover:bg-gray-300 transition"
                                        onClick={handleSave}
                                    >
                                        Save
                                    </button>
                                    {saved && (
                                        <span className="saved-indicator">
                                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">       
                                                <circle cx="10" cy="10" r="10" fill="#22c55e"/>
                                                <path d="M6 10.5l2.5 2.5 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            <p style={{ marginLeft: '6px' }}>Reflection Saved</p>
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="border border-gray-300 p-2 center-cell">
                                <button
                                    type="button"
                                    className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded hover:bg-indigo-200 transition"
                                    onClick={fetchAllReflections}
                                >
                                    Show Reflections
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-2">Other Members' Reflections</h3>
                        <div className="reflection-list">
                            {Object.keys(allReflections).length === 0 ? (
                                <p className="text-gray-500">No reflections yet.</p>
                            ) : (
                                Object.entries(allReflections).map(([uid, { name, reflection }]) => (
                                    <div key={uid} className="reflection-item">
                                        <span className="reflection-uid">{name}</span>
                                        <div className="reflection-text">{reflection}</div>
                                    </div>
                                ))
                            )}
                        </div>
                        <button
                            className="modal-close-btn"
                            type="button"
                            onClick={() => setShowModal(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Meetings;