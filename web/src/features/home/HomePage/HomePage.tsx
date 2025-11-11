import React from "react";
import { useNavigate } from "react-router-dom";
import HeaderBar from "../../../components/HeaderBar";
import { User } from "firebase/auth";
import { Database } from "firebase/database";

interface HomeProps {
  user: User | null;
  db: Database;
}

const HomePage: React.FC<HomeProps> = ({ user, db }) => {
  const navigate = useNavigate();

  const tools = [
    {
      title: "Club Management",
      description: "Create and manage multiple book clubs with customizable settings, member roles, and club profiles.",
      icon: "👥",
    },
    {
      title: "Meeting Organization",
      description: "Track scheduled meetings, set reading assignments, and collect weekly reflections from members.",
      icon: "📅",
    },
    {
      title: "Book Selection & Voting",
      description: "Submit book suggestions and vote using instant-runoff voting. View live leaderboards with reading progress.",
      icon: "🗳️",
    },
    {
      title: "Member Invitations",
      description: "Send email-based invitations to join clubs. Manage member roles (admin/member) and track participation.",
      icon: "✉️",
    },
    {
      title: "Reading Progress",
      description: "Track reading progress with chapter schedules, progress percentages, and completion tracking.",
      icon: "📊",
    },
    {
      title: "Book Ratings & History",
      description: "Rate books after completion, maintain a reading history, and track which members read each book.",
      icon: "⭐",
    },
  ];

  return (
    <>
      <HeaderBar user={user} db={db} />
      <div style={{ marginTop: "60px", backgroundColor: "#f8f9fa" }}>
        {/* Hero Section */}
        <section
          style={{
            background: "linear-gradient(135deg, #00356B 0%, #00509E 100%)",
            color: "white",
            padding: "6rem 2rem",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: "900px", margin: "0 auto" }}>
            <div
              style={{
                fontSize: "3.5rem",
                marginBottom: "1rem",
              }}
            >
              📚
            </div>
            <h1
              style={{
                fontSize: "clamp(2.5rem, 5vw, 4rem)",
                fontWeight: "bold",
                marginBottom: "1.5rem",
                lineHeight: "1.2",
              }}
            >
              BookClurb
            </h1>
            <p
              style={{
                fontSize: "clamp(1.2rem, 2.5vw, 1.5rem)",
                marginBottom: "2rem",
                lineHeight: "1.6",
                opacity: 0.95,
                maxWidth: "700px",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Open-source management platform for book clubs
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap", marginBottom: "2rem" }}>
              {!user && (
                <>
                  <button
                    onClick={() => navigate("/login")}
                    style={{
                      padding: "1rem 2.5rem",
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      background: "white",
                      color: "#00356B",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                    }}
                  >
                    Get Started
                  </button>
                  <button
                    onClick={() => navigate("/blog")}
                    style={{
                      padding: "1rem 2.5rem",
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      background: "transparent",
                      color: "white",
                      border: "2px solid white",
                      borderRadius: "8px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    Learn More
                  </button>
                </>
              )}
              {user && (
                <button
                  onClick={() => navigate("/clubs")}
                  style={{
                    padding: "1rem 2.5rem",
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    background: "white",
                    color: "#00356B",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                  }}
                >
                  Go to My Clubs
                </button>
              )}
            </div>
            <a
              href="https://github.com/dhvogel/bookclurb"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "white",
                textDecoration: "none",
                fontSize: "1rem",
                opacity: 0.9,
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "opacity 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "0.9";
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              View on GitHub
            </a>
          </div>
        </section>

        {/* Tools Section */}
        <section
          style={{
            padding: "5rem 2rem",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "4rem" }}>
            <h2
              style={{
                fontSize: "clamp(2rem, 4vw, 2.5rem)",
                fontWeight: "bold",
                color: "#00356B",
                marginBottom: "1rem",
              }}
            >
              Open-Source Tools for Book Clubs
            </h2>
            <p
              style={{
                fontSize: "1.2rem",
                color: "#666",
                maxWidth: "700px",
                margin: "0 auto",
                lineHeight: "1.6",
              }}
            >
              Everything you need to run your book club efficiently, from managing meetings to selecting books fairly.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "2rem",
            }}
          >
            {tools.map((tool, index) => (
              <div
                key={index}
                style={{
                  background: "white",
                  padding: "2rem",
                  borderRadius: "12px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  transition: "all 0.3s ease",
                  border: "1px solid #e9ecef",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)";
                }}
              >
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
                  {tool.icon}
                </div>
                <h3
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    color: "#00356B",
                    marginBottom: "0.75rem",
                  }}
                >
                  {tool.title}
                </h3>
                <p
                  style={{
                    fontSize: "1rem",
                    color: "#666",
                    lineHeight: "1.6",
                    margin: 0,
                  }}
                >
                  {tool.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Open Source Section */}
        <section
          style={{
            background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
            padding: "5rem 2rem",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <h2
              style={{
                fontSize: "clamp(2rem, 4vw, 2.5rem)",
                fontWeight: "bold",
                color: "#00356B",
                marginBottom: "1.5rem",
              }}
            >
              Why Open-Source?
            </h2>
            <p
              style={{
                fontSize: "1.2rem",
                color: "#666",
                lineHeight: "1.8",
                marginBottom: "2rem",
              }}
            >
              BookClurb is open-source to accomodate the unqiue rituals of different book clubs. Any club can contribute their process, to make it available to other clubs. Help us build tools that work for your club.
            </p>
            <div style={{ display: "flex", gap: "1.5rem", justifyContent: "center", flexWrap: "wrap" }}>
              <a
                href="https://github.com/dhvogel/bookclurb"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: "1rem 2.5rem",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  background: "#00356B",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.2)";
                  e.currentTarget.style.background = "#00509E";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
                  e.currentTarget.style.background = "#00356B";
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Contribute on GitHub
              </a>
              <a
                href="/blog"
                style={{
                  padding: "1rem 2.5rem",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  background: "white",
                  color: "#00356B",
                  border: "2px solid #00356B",
                  borderRadius: "8px",
                  cursor: "pointer",
                  textDecoration: "none",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#00356B";
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.color = "#00356B";
                }}
              >
                Read the Blog
              </a>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        {!user && (
          <section
            style={{
              background: "linear-gradient(135deg, #00356B 0%, #00509E 100%)",
              color: "white",
              padding: "4rem 2rem",
              textAlign: "center",
            }}
          >
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
              <h2
                style={{
                  fontSize: "clamp(1.8rem, 3vw, 2.2rem)",
                  fontWeight: "bold",
                  marginBottom: "1rem",
                }}
              >
                Ready to streamline your book club?
              </h2>
              <p
                style={{
                  fontSize: "1.2rem",
                  marginBottom: "2rem",
                  opacity: 0.95,
                }}
              >
                Get started today and make running your book club easier than ever.
              </p>
              <button
                onClick={() => navigate("/login")}
                style={{
                  padding: "1rem 3rem",
                  fontSize: "1.2rem",
                  fontWeight: "600",
                  background: "white",
                  color: "#00356B",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
                }}
              >
                Get Started Free
              </button>
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export default HomePage;

