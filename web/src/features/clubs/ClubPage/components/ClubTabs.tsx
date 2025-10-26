import React from 'react';

interface ClubTabsProps {
  activeTab: 'overview' | 'discussions' | 'members' | 'books';
  setActiveTab: (tab: 'overview' | 'discussions' | 'members' | 'books') => void;
}

const ClubTabs: React.FC<ClubTabsProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'discussions', label: 'Discussions', icon: '💬' },
    { id: 'members', label: 'Members', icon: '👥' },
    { id: 'books', label: 'Books', icon: '📚' }
  ];

  return (
    <div style={{ 
      display: 'flex', 
      gap: '0.5rem', 
      marginBottom: '2rem',
      background: 'white',
      borderRadius: '12px',
      padding: '0.5rem',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as any)}
          style={{
            flex: 1,
            padding: '1rem',
            border: 'none',
            background: activeTab === tab.id ? 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)' : 'transparent',
            color: activeTab === tab.id ? 'white' : '#666',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ marginRight: '0.5rem' }}>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default ClubTabs;
