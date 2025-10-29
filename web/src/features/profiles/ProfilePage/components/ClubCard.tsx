import React from 'react';
import { motion } from 'framer-motion';
import { Club } from '../../../../types';

interface ClubCardProps {
  club: Club;
  onClubClick: (clubId: string) => void;
  onLeaveClubClick: (clubId: string, clubName: string, e: React.MouseEvent) => void;
  onSettingsClick: (clubId: string, e: React.MouseEvent) => void;
  openSettingsMenu: string | null;
}

const ClubCard: React.FC<ClubCardProps> = ({ 
  club, 
  onClubClick, 
  onLeaveClubClick, 
  onSettingsClick, 
  openSettingsMenu 
}) => {
  return (
    <div
      key={club.id}
      onClick={() => onClubClick(club.id)}
      style={{
        backgroundColor: "white",
        borderRadius: "12px",
        border: "1px solid #e9ecef",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
        overflow: openSettingsMenu === club.id ? "visible" : "hidden"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.05)";
      }}
    >
      {/* Club Cover */}
      <div style={{
        height: "120px",
        backgroundColor: club.coverColor || "#667eea",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "2.5rem",
        color: "white",
        fontWeight: "bold"
      }}>
        {club.name.charAt(0).toUpperCase()}
      </div>
      
      {/* Club Info */}
      <div style={{ padding: "1rem" }}>
        <h4 style={{ 
          margin: "0 0 0.5rem 0",
          fontSize: "1.1rem",
          fontWeight: "600",
          color: "#212529"
        }}>
          {club.name}
        </h4>
        
        {club.description && (
          <p style={{ 
            margin: "0 0 0.5rem 0",
            fontSize: "0.875rem",
            color: "#6c757d",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}>
            {club.description}
          </p>
        )}
        
        <div style={{ 
          display: "flex", 
          alignItems: "center",
          gap: "0.5rem",
          fontSize: "0.875rem",
          color: "#6c757d",
          marginBottom: "0.75rem"
        }}>
          <span>👥 {club.memberCount} members</span>
        </div>
        
        {club.currentBook && (
          <div style={{ 
            marginBottom: "0.75rem",
            paddingBottom: "0.75rem",
            borderBottom: "1px solid #e9ecef",
            fontSize: "0.875rem",
            color: "#495057"
          }}>
            <strong>Current Book:</strong> {club.currentBook.title}
          </div>
        )}
        
        <div style={{ position: "relative" }} data-settings-menu>
          <button
            onClick={(e) => onSettingsClick(club.id, e)}
            data-settings-menu
            style={{
              width: "100%",
              backgroundColor: "#f8f9fa",
              color: "#495057",
              border: "1px solid #dee2e6",
              borderRadius: "6px",
              padding: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: "500",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#e9ecef";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f8f9fa";
            }}
          >
            ⚙️ Settings
          </button>
          
          {openSettingsMenu === club.id && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              data-settings-menu
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: "0.25rem",
                backgroundColor: "white",
                border: "1px solid #dee2e6",
                borderRadius: "6px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                zIndex: 10000,
                overflow: "visible",
                minHeight: "auto",
                visibility: "visible"
              }}
            >
              <button
                onClick={(e) => onLeaveClubClick(club.id, club.name, e)}
                style={{
                  width: "100%",
                  backgroundColor: "#fff",
                  color: "#dc3545",
                  border: "none",
                  borderRadius: "0",
                  padding: "0.75rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "left"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#fff5f5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#fff";
                }}
              >
                🚪 Leave Club
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClubCard;

