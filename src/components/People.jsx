import { b } from "framer-motion/client";
import React from "react";
import HeaderBar from "./HeaderBar";
import members from "../config/members";

const About = ({ user }) => {
  return (
    <div>
      <HeaderBar user={user} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: "20px",
          marginTop: "8rem",
        }}
      >
        {Array.isArray(members) &&
          members.map((member) => {
            const checkMembers = ["Charles", "Grant", "Dan", "Alden"];
            const hasRead = checkMembers.includes(member.name);
            // Calculate books read
            const books = [
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
            const booksRead =
              books.filter((b) => b.read).length +
              books.filter((b) => b.halfCredit).length * 0.5;
            const totalBooks = books.length;

            return (
              <div key={member.name} style={{ textAlign: "center" }}>
                <img
                  src={member.img}
                  alt={member.name}
                  style={{
                    borderRadius: "50%",
                    width: 100,
                    height: 100,
                    objectFit: "cover",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                  }}
                  referrerPolicy="no-referrer"
                />
                <div
                  style={{
                    marginTop: "0.5rem",
                    fontWeight: "bold",
                    fontSize: "1.1em",
                    letterSpacing: "1px",
                  }}
                >
                  {member.name}
                </div>
                <table
                  style={{
                    width: "100%",
                    marginTop: "1rem",
                    borderCollapse: "separate",
                    borderSpacing: "0 6px",
                    background:
                      "linear-gradient(135deg, #f8fafc 70%, #e0e7ff 100%)",
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(60,60,120,0.07)",
                  }}
                >
                  <tbody>
                    {books.map((book, idx) => {
                      let rowBg;
                      if (book.halfCredit) {
                        rowBg = "rgba(255, 251, 170, 0.7)"; // light yellow
                      } else {
                        rowBg = book.read
                          ? "rgba(220,255,220,0.6)"
                          : "rgba(255,230,230,0.5)";
                      }
                      return (
                        <tr
                          key={book.title}
                          style={{
                            background: rowBg,
                            borderRadius: "8px",
                            transition: "background 0.2s",
                          }}
                        >
                          <td
                            style={{
                              fontWeight: "bold",
                              padding: "6px 8px",
                              border: "none",
                              borderRadius: "8px 0 0 8px",
                              fontSize: "0.8em",
                            }}
                          >
                            {book.title}
                          </td>
                          <td
                            style={{
                              padding: "6px 8px",
                              border: "none",
                              borderRadius: "0 8px 8px 0",
                              color: book.read ? "#22c55e" : "#ef4444",
                              fontSize: "1.3em",
                              textAlign: "center",
                            }}
                          >
                            {book.halfCredit ? "🌓" : book.read ? "🎉" : "💤"}
                          </td>
                        </tr>
                      );
                    })}
                    <tr>
                      <td
                        style={{
                          fontWeight: "bold",
                          padding: "6px 8px",
                          border: "none",
                          borderRadius: "8px 0 0 8px",
                          background: "#facc15",
                          color: "#3b3b3b",
                          fontSize: "0.8em",
                        }}
                      >
                        Participation
                      </td>
                      <td
                        style={{
                          padding: "6px 8px",
                          border: "none",
                          borderRadius: "0 8px 8px 0",
                          background: "#fde68a",
                          color: "#92400e",
                          fontWeight: "bold",
                          fontSize: "1.1em",
                          textAlign: "center",
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
