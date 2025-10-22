import React from "react";
import { color, motion } from "framer-motion";

// SOMBookClubHome.tsx
// Dark, moody homepage hero for a book club. Fullscreen background image.

const SOMBookClubHome: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        width: "100vw",
      }}
    >
      <p
        style={{
          color: "white",
          margin: "50px",
          fontWeight: "bold",
          WebkitTextStroke: "0.2px black",
          fontSize: "100px",
          textAlign: "center",
          width: "100%",
          maxWidth: "100vw",
          wordBreak: "break-word",
        }}
      >
        SOM Book Club
      </p>
    </div>
  );
};

export default SOMBookClubHome;
