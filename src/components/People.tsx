import React from "react";
import HeaderBar from "./HeaderBar";
import members from "../config/members";
import { PeopleProps } from "../types";

const About: React.FC<PeopleProps> = ({ user, db }) => {
  return (
    <div>
      <HeaderBar user={user} db={db} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
          paddingTop: "15px",   // space for header
          padding: "0 24px",
          maxWidth: "1400px",
          margin: "100px auto 0",
        }}
      >
        {Array.isArray(members) &&
          members.map((member) => {
            return (
              <div 
                key={member.name} 
                style={{ 
                  textAlign: "center",
                  background: "linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)",
                  borderRadius: "16px",
                  padding: "24px 20px",
                  boxShadow: "0 16px 32px rgba(0,0,0,0.08), 0 6px 12px rgba(0,0,0,0.04)",
                  border: "1px solid rgba(255,255,255,0.8)",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-8px)";
                  e.currentTarget.style.boxShadow = "0 32px 64px rgba(0,0,0,0.12), 0 16px 32px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.08), 0 8px 16px rgba(0,0,0,0.04)";
                }}
              >
                {/* Decorative gradient overlay */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "4px",
                    background: "linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
                    borderRadius: "20px 20px 0 0",
                  }}
                />
                <img
                  src={member.img}
                  alt={member.name}
                  style={{
                    borderRadius: "50%",
                    width: 100,
                    height: 100,
                    objectFit: "cover",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.15), 0 3px 12px rgba(0,0,0,0.1)",
                    border: "3px solid rgba(255,255,255,0.9)",
                    marginBottom: "16px",
                    transition: "all 0.3s ease",
                  }}
                  referrerPolicy="no-referrer"
                />
                <div
                  style={{
                    fontWeight: "700",
                    fontSize: "1.3em",
                    letterSpacing: "0.5px",
                    color: "#1e293b",
                    textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  {member.name}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default About;