import React from "react";
import HeaderBar from "./HeaderBar";
import { User } from "firebase/auth";
import { Database } from "firebase/database";

interface SignupProps {
  user: User | null;
  db: Database;
}

const Signup: React.FC<SignupProps> = ({ user, db }) => {
  return (
    <>
      <HeaderBar user={user} db={db} />
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">Join Book Clurb</h1>
            <p className="login-subtitle">We're not accepting new signups yet</p>
          </div>
          
          <div style={{
            textAlign: "center",
            padding: "3rem 1rem",
            color: "#6b7280"
          }}>
            <div style={{
              fontSize: "4rem",
              marginBottom: "1.5rem",
              opacity: 0.6
            }}>
              🚧
            </div>
            <h3 style={{ 
              margin: "0 0 1rem 0", 
              fontSize: "1.5rem",
              color: "#374151",
              fontWeight: "600"
            }}>
              Coming Soon
            </h3>
            <p style={{ 
              margin: "0 0 1.5rem 0",
              fontSize: "1.1rem",
              lineHeight: "1.6"
            }}>
              We're working hard to bring you the best book club experience. 
              New signups will be available soon!
            </p>
            <div style={{
              backgroundColor: "#f3f4f6",
              borderRadius: "12px",
              padding: "1.5rem",
              margin: "2rem 0",
              border: "1px solid #e5e7eb"
            }}>
              <h4 style={{
                margin: "0 0 0.75rem 0",
                fontSize: "1.1rem",
                color: "#374151",
                fontWeight: "600"
              }}>
                Stay Updated
              </h4>
              <p style={{
                margin: "0 0 1rem 0",
                fontSize: "0.95rem",
                color: "#6b7280"
              }}>
                Check back regularly or contact us to be notified when signups open.
              </p>
              <p style={{
                margin: "0",
                fontSize: "0.95rem",
                color: "#6b7280"
              }}>
                Have questions? Visit our{" "}
                <a 
                  href="https://github.com/dhvogel/bookclurb" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    color: "#00356B", 
                    textDecoration: "none",
                    fontWeight: "500"
                  }}
                >
                  GitHub repository
                </a>{" "}
                for more information.
              </p>
            </div>
          </div>

          <div className="login-footer">
            <p className="footer-text">
              Already have an account? 
              <a href="/login" className="footer-link"> Sign in here</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
