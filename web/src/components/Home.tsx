import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HeaderBar from "./HeaderBar";
import { User } from "firebase/auth";
import { Database, ref, onValue } from "firebase/database";

interface HomeProps {
  user: User | null;
  db: Database;
}

const Home: React.FC<HomeProps> = ({ user, db }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // If user is logged in, redirect to their first club
    if (user && db) {
      const userRef = ref(db, `users/${user.uid}`);
      onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        if (userData && userData.clubs && userData.clubs.length > 0) {
          // Redirect to the first club
          navigate(`/clubs/${userData.clubs[0]}`);
        }
      });
    }
  }, [user, db, navigate]);

  return (
    <>
      <HeaderBar user={user} db={db} />
      <div
        style={{
          marginTop: "80px", // Account for fixed header
          minHeight: "calc(100vh - 80px)",
          backgroundImage: "url('/storm-photo.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div
          style={{
            textAlign: "center",
            color: "white",
            maxWidth: "800px",
            background: "rgba(0, 0, 0, 0.3)",
            padding: "3rem",
            borderRadius: "20px",
            backdropFilter: "blur(10px)",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(2.5rem, 8vw, 4rem)",
              fontWeight: "bold",
              marginBottom: "1rem",
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
            }}
          >
            Welcome to Book Clurb
          </h1>
          <p
            style={{
              fontSize: "clamp(1.2rem, 3vw, 1.5rem)",
              marginBottom: "2rem",
              lineHeight: "1.6",
              textShadow: "1px 1px 2px rgba(0,0,0,0.5)",
            }}
          >
            Join a community of passionate readers. Discover new books, share insights, 
            and connect with fellow book lovers.
          </p>
          {!user && (
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => navigate("/login")}
                style={{
                  padding: "1rem 2rem",
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  background: "linear-gradient(45deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "50px",
                  cursor: "pointer",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                  transition: "transform 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Get Started
              </button>
              <button
                onClick={() => navigate("/people")}
                style={{
                  padding: "1rem 2rem",
                  fontSize: "1.2rem",
                  fontWeight: "bold",
                  background: "transparent",
                  color: "white",
                  border: "2px solid white",
                  borderRadius: "50px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.color = "#333";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "white";
                }}
              >
                Explore
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
