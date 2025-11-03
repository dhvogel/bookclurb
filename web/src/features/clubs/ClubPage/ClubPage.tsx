import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { Database } from 'firebase/database';
import { motion, AnimatePresence } from 'framer-motion';
import HeaderBar from '../../../components/HeaderBar';
import { useClubData } from './useClubData';
import ClubHeader from './components/ClubHeader';
import ClubTabs from './components/ClubTabs';
import OverviewTab from './components/OverviewTab';
import MembersTab from './components/MembersTab';
import BooksTab from './components/BooksTab';
import SettingsTab from './components/SettingsTab';

interface ClubPageProps {
  user: User | null;
  db: Database;
}

const ClubPage: React.FC<ClubPageProps> = ({ user, db }) => {
  const navigate = useNavigate();
  const { club, loading } = useClubData({ db, user });
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'books' | 'settings'>('overview');

  if (loading) {
    return (
      <>
        <HeaderBar user={user} db={db} />
        <div style={{ marginTop: '80px', padding: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.2rem', color: '#666' }}>Loading club details...</div>
        </div>
      </>
    );
  }

  if (!club) {
    return (
      <>
        <HeaderBar user={user} db={db} />
        <div style={{ marginTop: '80px', padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ color: '#333', marginBottom: '1rem' }}>Club not found</h2>
          <p style={{ color: '#666', marginBottom: '2rem' }}>The club you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => navigate('/clubs')}
            style={{
              padding: '1rem 2rem',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Back to My Clubs
          </button>
        </div>
      </>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewTab club={club} user={user} db={db} />;
      case 'members':
        return <MembersTab club={club} user={user} db={db} />;
      case 'books':
        return <BooksTab club={club} userId={user?.uid || ''} db={db} />;
      case 'settings':
        return <SettingsTab club={club} user={user} db={db} />;
      default:
        return <OverviewTab club={club} user={user} db={db} />;
    }
  };

  return (
    <>
      <HeaderBar user={user} db={db} />
      <div style={{ marginTop: '60px', minHeight: 'calc(100vh - 60px)', background: '#f8f9fa' }}>
        <ClubHeader club={club} />
        
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }} className="club-page-container">
          <ClubTabs activeTab={activeTab} setActiveTab={setActiveTab} club={club} user={user} />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
        <style>{`
          @media (max-width: 768px) {
            .club-page-container {
              padding: 1rem !important;
            }
          }
          @media (max-width: 480px) {
            .club-page-container {
              padding: 0.75rem !important;
            }
          }
        `}</style>
      </div>
    </>
  );
};

export default ClubPage;
