import React from 'react';
import { Club } from '../../../../../types';

interface ClubStatsProps {
  club: Club;
}

const ClubStats: React.FC<ClubStatsProps> = ({ club }) => {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '2rem',
      marginBottom: '2rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#333' }}>
        Club Stats
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#666' }}>👥 Members</span>
          <span style={{ fontWeight: 'bold', color: '#333' }}>{club.members?.length || 0}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#666' }}>📚 Books Read</span>
          <span style={{ fontWeight: 'bold', color: '#333' }}>{club.booksRead?.length || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default ClubStats;
