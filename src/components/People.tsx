import { b } from "framer-motion/client";
import React from "react";
import HeaderBar from "./HeaderBar";
import members from "../config/members";
import { PeopleProps, Book } from "../types";

const About: React.FC<PeopleProps> = ({ user, db }) => {
  return (
    <div>
      <HeaderBar user={user} db={db} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "24px",
          marginTop: "100px",
          padding: "0 24px",
          maxWidth: "1400px",
          margin: "100px auto 0",
        }}
      >
        {Array.isArray(members) &&
          members.map((member) => {
            const checkMembers = ["Charles", "Grant", "Dan", "Alden"];
            const hasRead = checkMembers.includes(member.name);
            // Calculate books read
            const books: Book[] = [
              {
                title: "Tale of Two Cities",
                read: ["Charles", "Grant", "Dan", "Alden"].includes(
                  member.name
                ),
              },
              {
                title: "Grapes of Wrath",
                read: ["Grant", "Dan", "Alden", "Charles"].includes(
                  member.name
                ),
              },
              {
                title: "Socialism",
                read: ["Dan", "Grant", "Alden"].includes(member.name),
              },
              {
                title: "Bomber Mafia",
                read: ["Dan", "Grant", "Alden"].includes(member.name),
              },
              {
                title: "The Secret Agent",
                read: ["Dan", "Grant", "Dhru"].includes(member.name),
              },
              {
                title: "Catch-22",
                read: ["Dan", "Grant", "Dhru", "David"].includes(member.name),
              },
              {
                title: "Valiant Ambition",
                read: ["Dan", "Grant", "Dhru", "David"].includes(member.name),
              },
              {
                title: "Poor Economics",
                read: [
                  "Dan",
                  "Grant",
                  "Dhru",
                  "David",
                  "Margaret",
                  "Paul",
                ].includes(member.name),
              },
              {
                title: "The Fourth Turning",
                read:
                  ["Dan", "Grant", "Dhru"].includes(member.name) ||
                  member.name === "David",
                halfCredit: member.name === "David",
              },
            ];
            const booksRead: number =
              books.filter((b) => b.read).length +
              books.filter((b) => b.halfCredit).length * 0.5;
            const totalBooks: number = books.length;

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
                    marginBottom: "20px",
                    fontWeight: "700",
                    fontSize: "1.3em",
                    letterSpacing: "0.5px",
                    color: "#1e293b",
                    textShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  {member.name}
                </div>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "separate",
                    borderSpacing: "0 8px",
                    background: "rgba(255,255,255,0.6)",
                    borderRadius: "16px",
                    boxShadow: "inset 0 2px 8px rgba(0,0,0,0.06)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.3)",
                  }}
                >
                  <tbody>
                    {books.map((book, idx) => {
                      let rowBg: string;
                      let borderColor: string;
                      if (book.halfCredit) {
                        rowBg = "linear-gradient(135deg, rgba(255, 251, 170, 0.8) 0%, rgba(255, 243, 102, 0.6) 100%)";
                        borderColor = "rgba(255, 193, 7, 0.3)";
                      } else {
                        rowBg = book.read
                          ? "linear-gradient(135deg, rgba(220, 255, 220, 0.8) 0%, rgba(187, 247, 208, 0.6) 100%)"
                          : "linear-gradient(135deg, rgba(255, 230, 230, 0.8) 0%, rgba(254, 202, 202, 0.6) 100%)";
                        borderColor = book.read 
                          ? "rgba(34, 197, 94, 0.3)" 
                          : "rgba(239, 68, 68, 0.3)";
                      }
                      return (
                        <tr
                          key={book.title}
                          style={{
                            background: rowBg,
                            borderRadius: "12px",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            border: `1px solid ${borderColor}`,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          }}
                        >
                          <td
                            style={{
                              fontWeight: "600",
                              padding: "10px 14px",
                              border: "none",
                              borderRadius: "10px 0 0 10px",
                              fontSize: "0.8em",
                              color: "#374151",
                              letterSpacing: "0.3px",
                            }}
                          >
                            {book.title}
                          </td>
                          <td
                            style={{
                              padding: "10px 14px",
                              border: "none",
                              borderRadius: "0 10px 10px 0",
                              color: book.read ? "#059669" : "#dc2626",
                              fontSize: "1.3em",
                              textAlign: "center",
                              fontWeight: "600",
                            }}
                          >
                            {book.halfCredit ? "🌓" : book.read ? "✨" : "⏳"}
                          </td>
                        </tr>
                      );
                    })}
                    <tr>
                      <td
                        style={{
                          fontWeight: "700",
                          padding: "12px 16px",
                          border: "none",
                          borderRadius: "10px 0 0 10px",
                          background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                          color: "#1f2937",
                          fontSize: "0.85em",
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                          boxShadow: "0 3px 10px rgba(251, 191, 36, 0.3)",
                        }}
                      >
                        Participation
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          borderRadius: "0 10px 10px 0",
                          background: "linear-gradient(135deg, #fde68a 0%, #fbbf24 100%)",
                          color: "#92400e",
                          fontWeight: "700",
                          fontSize: "1.1em",
                          textAlign: "center",
                          boxShadow: "0 3px 10px rgba(251, 191, 36, 0.2)",
                          border: "1px solid rgba(251, 191, 36, 0.3)",
                        }}
                      >
                        {booksRead}/{totalBooks} 📚
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default About;
