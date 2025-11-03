import React from 'react';

interface ClubTabsProps {
  activeTab: 'overview' | 'members' | 'books';
  setActiveTab: (tab: 'overview' | 'members' | 'books') => void;
}

const ClubTabs: React.FC<ClubTabsProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'books', label: 'Books', icon: '📚' }
  ];

  return (
    <div style={{ 
      display: 'flex', 
      gap: '0.25rem', 
      marginBottom: '2rem',
      background: 'white',
      borderRadius: '12px',
      padding: '0.25rem',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }} className="club-tabs-container">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as any)}
          style={{
            flex: 1,
            padding: '0.75rem 0.25rem',
            border: 'none',
            background: activeTab === tab.id ? 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)' : 'transparent',
            color: activeTab === tab.id ? 'white' : '#666',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            fontSize: '0.8rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          className="club-tab-button"
        >
          <span>{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
      <style>{`
        .club-tab-button {
          min-width: 0;
        }
        @media (max-width: 768px) {
          .club-tabs-container {
            gap: 0.125rem;
            padding: 0.125rem;
          }
          .club-tab-button {
            padding: 0.7rem 0.2rem !important;
            font-size: 0.7rem !important;
            gap: 0.125rem !important;
          }
        }
        @media (max-width: 480px) {
          .tab-label {
            display: none;
          }
          .club-tabs-container {
            gap: 0.125rem;
            padding: 0.125rem;
          }
          .club-tab-button {
            padding: 0.75rem 0.375rem !important;
            gap: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ClubTabs;
