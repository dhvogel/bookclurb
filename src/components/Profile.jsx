import React from "react";
import HeaderBar from "./HeaderBar";
import { getAuth, signOut } from "firebase/auth";
import { onValue, ref, update } from "firebase/database";
import { u } from "framer-motion/client";

const Profile = ({ user, db }) => {
  const [userNotifications, setUserNotifications] = React.useState([]);

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  React.useEffect(() => {
    if (user) {
      const notificationRef = ref(db, `notifications/${user.uid}`);
      onValue(notificationRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Convert object to array if necessary
          const notificationsArray = Array.isArray(data)
            ? data
            : Object.entries(data).map(([id, notif]) => ({
                ...notif,
                id,
              }));
          setUserNotifications(notificationsArray);
        } else {
          setUserNotifications([]);
        }
      });
    }
  }, [user, db]);

  // Example notifications data with isRead property
  const notifications = [
    {
      date: "2024-06-01",
      message: "Welcome to the Book Club!",
      isRead: true,
    },
    {
      date: "2024-06-05",
      message: "Your profile was updated.",
      isRead: false,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "row", width: "100%" }}>
      {/* HeaderBar on top */}
      <HeaderBar user={user} db={db} />
      {/* Left Side: Profile Info */}
      <div
        style={{
          flex: 1,
          paddingRight: "2em",
          borderRight: "1px solid #eee",
          paddingTop: "100px",
        }}
      >
        <h1>Profile</h1>
        <div style={{ marginTop: "5%" }}>
          {user ? (
            <>
              User logged in: {user.email}
              <br />
              <button onClick={handleLogout} style={{ marginTop: "1em" }}>
                Logout
              </button>
            </>
          ) : (
            "no user logged in"
          )}
        </div>
      </div>
      {/* Right Side: Notifications Table */}
      <div style={{ flex: 1, paddingLeft: "2em", paddingTop: "100px" }}>
        <h2>Notifications</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th
                style={{
                  borderBottom: "1px solid #ccc",
                  textAlign: "left",
                  padding: "0.5em",
                }}
              >
                Date
              </th>
              <th
                style={{
                  borderBottom: "1px solid #ccc",
                  textAlign: "left",
                  padding: "0.5em",
                }}
              >
                Message
              </th>
            </tr>
          </thead>
          <tbody>
            {userNotifications.map((notif, idx) => (
              <tr key={idx}>
                <td
                  style={{ padding: "0.5em", borderBottom: "1px solid #eee" }}
                >
                  {notif.timestamp
                    ? new Date(notif.timestamp).toLocaleString()
                    : ""}
                </td>
                <td
                  style={{ padding: "0.5em", borderBottom: "1px solid #eee" }}
                >
                  {notif.text}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Profile;
