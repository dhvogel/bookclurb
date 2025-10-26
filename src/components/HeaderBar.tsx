import {
  equalTo,
  onValue,
  orderByChild,
  query,
  ref,
  update,
  Database,
} from "firebase/database";
import React from "react";
import { useLocation } from "react-router-dom";
import { User } from "firebase/auth";
import { HeaderBarProps, Notification } from "../types";

const HeaderBar: React.FC<HeaderBarProps> = ({ user, db }) => {
  const location = useLocation();
  const isLiteraryProfile = location.pathname === "/literary-profile";
  const isClubs = location.pathname === "/clubs";
  const [unreadCount, setUnreadCount] = React.useState<number>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState<boolean>(false);

  // Close mobile menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMobileMenuOpen && !target.closest('.mobile-nav') && !target.closest('.mobile-menu-btn')) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  React.useEffect(() => {
    if (!user || !db) return;
    const unreadQuery = query(
      ref(db, `notifications/${user.uid}`),
      orderByChild("isRead"),
      equalTo(false)
    );

    const unsubscribe = onValue(unreadQuery, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setUnreadCount(Object.keys(data).length);
      } else {
        setUnreadCount(0);
      }
    });
    return () => unsubscribe();
  }, [user?.uid, db]);

  const setNotificationsUnread = (user: User, db: Database) => {
    if (!user || !db) return;
    // Only update if not already read
    // Fetch all notifications for the user and mark unread ones as read
    onValue(
      ref(db, `notifications/${user.uid}`),
      (snapshot) => {
        if (snapshot.exists()) {
          const notifications = snapshot.val() as Record<string, Notification>;
          Object.entries(notifications).forEach(([id, notif]) => {
            if (!notif.isRead) {
              update(ref(db, `notifications/${user.uid}/${id}`), {
                isRead: true,
              });
            }
          });
        }
      },
      { onlyOnce: true }
    );
  };

  // Map emails to member info
  const emailToMember: Record<string, { name: string; img: string }> = {
    "dhvogel2468@gmail.com": {
      name: "Dan",
      img: "https://api.dicebear.com/7.x/bottts/png?seed=Dan&backgroundColor=ffffff",
    },
    "alden@sombookclub.com": {
      name: "Alden",
      img: "https://api.dicebear.com/7.x/bottts/png?seed=Alden&backgroundColor=ffffff",
    },
    "charles@sombookclub.com": {
      name: "Charles",
      img: "https://api.dicebear.com/7.x/bottts/png?seed=Charles&backgroundColor=ffffff",
    },
    "david@sombookclub.com": {
      name: "David",
      img: "https://api.dicebear.com/7.x/bottts/png?seed=David&backgroundColor=ffffff",
    },
    "dhru@sombookclub.com": {
      name: "Dhru",
      img: "https://api.dicebear.com/7.x/bottts/png?seed=Dhru&backgroundColor=ffffff",
    },
    "grant@sombookclub.com": {
      name: "Grant",
      img: "https://api.dicebear.com/7.x/bottts/png?seed=Grant&backgroundColor=ffffff",
    },
    "margaret@sombookclub.com": {
      name: "Margaret",
      img: "https://api.dicebear.com/7.x/bottts/png?seed=Margaret&backgroundColor=ffffff",
    },
    "sam@sombookclub.com": {
      name: "Sam",
      img: "https://api.dicebear.com/7.x/bottts/png?seed=Sam&backgroundColor=ffffff",
    },
    "paul@sombookclub.com": {
      name: "Paul",
      img: "https://api.dicebear.com/7.x/bottts/png?seed=Paul&backgroundColor=ffffff",
    },
    "dan@sombookclub.com": {
      name: "Dan",
      img: "https://api.dicebear.com/7.x/bottts/png?seed=Dan&backgroundColor=ffffff",
    },
  };
  // Determine member info based on user email
  const member = user && user.email ? emailToMember[user.email] : undefined;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        background: "linear-gradient(90deg, #00356B 0%, #00509E 100%)",
        color: "white",
        padding: "0.75rem 1rem",
        boxShadow: "0 2px 8px rgba(60,60,120,0.07)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 1000,
        minHeight: "60px",
        flexWrap: "nowrap",
        overflow: "visible",
      }}
    >
      <h1 style={{ margin: 0, fontSize: "clamp(1.2rem, 2.5vw, 1.8rem)", letterSpacing: "1px", flexShrink: 0 }}>
        <a href="/" style={{ color: "inherit", textDecoration: "none" }}>
          <span
            style={{
              display: "inline-block",
              fontSize: "clamp(1rem, 2.5vw, 1.6rem)",
              letterSpacing: "1px",
              fontWeight: 700,
              whiteSpace: "nowrap",
              transition: "font-size 0.2s",
            }}
            className="hide-on-mobile"
          >
            Book Clurb
          </span>
          <span
            style={{
              display: "inline-block",
              fontSize: "clamp(1rem, 2.5vw, 1.6rem)",
              letterSpacing: "1px",
              fontWeight: 700,
              whiteSpace: "nowrap",
              transition: "font-size 0.2s",
            }}
            className="show-on-mobile"
          >
            Book Clurb
          </span>
          <style>
            {`
              @media (max-width: 768px) {
                .hide-on-mobile {
                  display: none !important;
                }
                .show-on-mobile {
                  display: inline-block !important;
                }
              }
              @media (min-width: 769px) {
                .show-on-mobile {
                  display: none !important;
                }
              }
            `}
          </style>
        </a>
      </h1>
      {/* Mobile hamburger menu button */}
      <button
        className="mobile-menu-btn"
        onClick={() => {
          console.log('Hamburger clicked, current state:', isMobileMenuOpen);
          setIsMobileMenuOpen(!isMobileMenuOpen);
        }}
        style={{
          display: "none",
          background: "none",
          border: "none",
          color: "white",
          fontSize: "1.5rem",
          marginRight: "3rem",
          cursor: "pointer",
          borderRadius: "4px",
          transition: "background 0.2s",
          flexShrink: 0,
          zIndex: 1001,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "none";
        }}
      >
        ☰
      </button>

      <nav 
        className="desktop-nav"
        style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "clamp(0.5rem, 1.5vw, 1rem)",
          flexShrink: 1,
          minWidth: 0,
          overflow: "hidden"
        }}
      >
        <a
          href="/meetings"
          style={{
            color: location.pathname === "/meetings" ? "#FFD700" : "white",
            background:
              location.pathname === "/meetings"
                ? "rgba(255,255,255,0.08)"
                : "transparent",
            padding: "clamp(0.3rem, 1vw, 0.5rem) clamp(0.6rem, 2vw, 1.2rem)",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: location.pathname === "/meetings" ? "bold" : "normal",
            fontSize: "clamp(0.9rem, 2vw, 1.1rem)",
            letterSpacing: "0.5px",
            transition: "background 0.2s, color 0.2s",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          Meetings
        </a>
        <a
          href="/clubs"
          style={{
            color: isClubs ? "#FFD700" : "white",
            background: isClubs ? "rgba(255,255,255,0.08)" : "transparent",
            padding: "clamp(0.3rem, 1vw, 0.5rem) clamp(0.6rem, 2vw, 1.2rem)",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: isClubs ? "bold" : "normal",
            fontSize: "clamp(0.9rem, 2vw, 1.1rem)",
            letterSpacing: "0.5px",
            transition: "background 0.2s, color 0.2s",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          Clubs
        </a>
        <a
          href="/literary-profile"
          style={{
            color: isLiteraryProfile ? "#FFD700" : "white",
            background: isLiteraryProfile
              ? "rgba(255,255,255,0.08)"
              : "transparent",
            padding: "clamp(0.3rem, 1vw, 0.5rem) clamp(0.6rem, 2vw, 1.2rem)",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: isLiteraryProfile ? "bold" : "normal",
            fontSize: "clamp(0.9rem, 2vw, 1.1rem)",
            letterSpacing: "0.5px",
            transition: "background 0.2s, color 0.2s",
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}
        >
          <span className="hide-on-mobile">Literary Profile</span>
          <span className="show-on-mobile">Profile</span>
        </a>
        {user ? (
          <a
            href="/profile"
            style={{
              display: "flex",
              alignItems: "center",
              padding: "0.2rem",
              marginRight: "clamp(0.5rem, 2vw, 1.5em)",
              borderRadius: "50%",
              background:
                location.pathname === "/profile"
                  ? "rgba(255,255,255,0.08)"
                  : "transparent",
              border: "2px solid #FFD700",
              transition: "background 0.2s, border 0.2s",
              position: "relative",
              flexShrink: 0,
            }}
            title={user.displayName || user.email || "User"}
          >
            <img
              src={
                member
                  ? member.img
                  : user.photoURL || "https://via.placeholder.com/40"
              }
              alt="Profile"
              style={{
                width: "clamp(32px, 4vw, 40px)",
                height: "clamp(32px, 4vw, 40px)",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid white",
              }}
              onClick={() => setNotificationsUnread(user, db)}
            />
            {unreadCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  minWidth: "clamp(18px, 3vw, 22px)",
                  height: "clamp(18px, 3vw, 22px)",
                  background: "red",
                  color: "white",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "clamp(0.8rem, 2vw, 0.95rem)",
                  fontWeight: "bold",
                  border: "2px solid white",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
                  zIndex: 2,
                }}
              >
                {unreadCount}
              </span>
            )}
          </a>
        ) : (
          <a
            href="/login"
            style={{
              color: location.pathname === "/login" ? "#FFD700" : "white",
              background:
                location.pathname === "/login"
                  ? "rgba(255,255,255,0.08)"
                  : "transparent",
              padding: "clamp(0.3rem, 1vw, 0.5rem) clamp(0.6rem, 2vw, 1.2rem)",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: location.pathname === "/login" ? "bold" : "normal",
              fontSize: "clamp(0.9rem, 2vw, 1.1rem)",
              letterSpacing: "0.5px",
              transition: "background 0.2s, color 0.2s",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Login
          </a>
        )}
      </nav>

      {/* Mobile navigation menu */}
      <div
        className="mobile-nav"
        style={{
          display: isMobileMenuOpen ? "flex" : "none",
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          background: "linear-gradient(90deg, #00356B 0%, #00509E 100%)",
          flexDirection: "column",
          padding: "1rem",
          boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
          zIndex: 1000,
          maxHeight: "calc(100vh - 60px)",
          overflowY: "auto",
        }}
      >
        <a
          href="/meetings"
          style={{
            color: location.pathname === "/meetings" ? "#FFD700" : "white",
            background: location.pathname === "/meetings" ? "rgba(255,255,255,0.08)" : "transparent",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: location.pathname === "/meetings" ? "bold" : "normal",
            fontSize: "1.1rem",
            letterSpacing: "0.5px",
            transition: "background 0.2s, color 0.2s",
            marginBottom: "0.5rem",
          }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Meetings
        </a>
        <a
          href="/clubs"
          style={{
            color: isClubs ? "#FFD700" : "white",
            background: isClubs ? "rgba(255,255,255,0.08)" : "transparent",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: isClubs ? "bold" : "normal",
            fontSize: "1.1rem",
            letterSpacing: "0.5px",
            transition: "background 0.2s, color 0.2s",
            marginBottom: "0.5rem",
          }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Clubs
        </a>
        <a
          href="/literary-profile"
          style={{
            color: isLiteraryProfile ? "#FFD700" : "white",
            background: isLiteraryProfile ? "rgba(255,255,255,0.08)" : "transparent",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: isLiteraryProfile ? "bold" : "normal",
            fontSize: "1.1rem",
            letterSpacing: "0.5px",
            transition: "background 0.2s, color 0.2s",
            marginBottom: "0.5rem",
          }}
          onClick={() => setIsMobileMenuOpen(false)}
        >
          Literary Profile
        </a>
        {user ? (
          <a
            href="/profile"
            style={{
              color: location.pathname === "/profile" ? "#FFD700" : "white",
              background: location.pathname === "/profile" ? "rgba(255,255,255,0.08)" : "transparent",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: location.pathname === "/profile" ? "bold" : "normal",
              fontSize: "1.1rem",
              letterSpacing: "0.5px",
              transition: "background 0.2s, color 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <img
              src={member ? member.img : user.photoURL || "https://via.placeholder.com/40"}
              alt="Profile"
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid white",
              }}
            />
            Profile {unreadCount > 0 && `(${unreadCount})`}
          </a>
        ) : (
          <a
            href="/login"
            style={{
              color: location.pathname === "/login" ? "#FFD700" : "white",
              background: location.pathname === "/login" ? "rgba(255,255,255,0.08)" : "transparent",
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: location.pathname === "/login" ? "bold" : "normal",
              fontSize: "1.1rem",
              letterSpacing: "0.5px",
              transition: "background 0.2s, color 0.2s",
            }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Login
          </a>
        )}
      </div>

      <style>
        {`
          @media (max-width: 768px) {
            .mobile-menu-btn {
              display: block !important;
            }
            .desktop-nav {
              display: none !important;
            }
          }
          @media (min-width: 769px) {
            .mobile-menu-btn {
              display: none !important;
            }
            .desktop-nav {
              display: flex !important;
            }
            .mobile-nav {
              display: none !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default HeaderBar;
