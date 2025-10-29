import React from 'react';
import { Club } from '../../../../types';
import ClubCard from './ClubCard';

interface MyClubsProps {
  clubs: Club[];
  clubsLoading: boolean;
  onClubClick: (clubId: string) => void;
  onLeaveClubClick: (clubId: string, clubName: string, e: React.MouseEvent) => void;
  onSettingsClick: (clubId: string, e: React.MouseEvent) => void;
  openSettingsMenu: string | null;
}

const MyClubs: React.FC<MyClubsProps> = ({
  clubs,
  clubsLoading,
  onClubClick,
  onLeaveClubClick,
  onSettingsClick,
  openSettingsMenu,
}) => {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <h3 style={{ 
        margin: "0 0 0.75rem 0", 
        fontSize: "1.1rem", 
        fontWeight: "600",
        color: "#495057"
      }}>
        My Clubs
      </h3>
      {clubsLoading ? (
        <div style={{
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          padding: "2rem",
          border: "1px solid #e9ecef",
          textAlign: "center",
          color: "#6c757d"
        }}>
          Loading clubs...
        </div>
      ) : clubs.length === 0 ? (
        <div style={{
          backgroundColor: "#f8f9fa",
          borderRadius: "8px",
          padding: "2rem",
          border: "1px solid #e9ecef",
          textAlign: "center",
          color: "#6c757d"
        }}>
          You're not part of any clubs yet.
        </div>
      ) : (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1rem"
        }}>
          {clubs.map((club) => (
            <ClubCard
              key={club.id}
              club={club}
              onClubClick={onClubClick}
              onLeaveClubClick={onLeaveClubClick}
              onSettingsClick={onSettingsClick}
              openSettingsMenu={openSettingsMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyClubs;

