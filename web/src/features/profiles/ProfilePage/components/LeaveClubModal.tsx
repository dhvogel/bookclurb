import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaveClubModalProps {
  clubToLeave: { id: string; name: string } | null;
  leavingClub: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const LeaveClubModal: React.FC<LeaveClubModalProps> = ({
  clubToLeave,
  leavingClub,
  onConfirm,
  onCancel,
}) => {
  return (
    <AnimatePresence>
      {clubToLeave && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              minWidth: '400px',
              maxWidth: '500px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              marginBottom: '1rem',
              color: '#333'
            }}>
              Leave Club?
            </div>
            
            <p style={{
              marginBottom: '1.5rem',
              color: '#666',
              lineHeight: '1.6'
            }}>
              Are you sure you want to leave <strong>"{clubToLeave.name}"</strong>?
            </p>

            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'flex-end' 
            }}>
              <button
                onClick={onCancel}
                disabled={leavingClub}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  background: '#f8f9fa',
                  color: '#495057',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  cursor: leavingClub ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s ease',
                  opacity: leavingClub ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!leavingClub) {
                    e.currentTarget.style.backgroundColor = '#e9ecef';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!leavingClub) {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }
                }}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={leavingClub}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem',
                  fontWeight: '500',
                  background: leavingClub ? '#ccc' : '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: leavingClub ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s ease',
                  opacity: leavingClub ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!leavingClub) {
                    e.currentTarget.style.backgroundColor = '#c82333';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!leavingClub) {
                    e.currentTarget.style.backgroundColor = '#dc3545';
                  }
                }}
              >
                {leavingClub ? 'Leaving...' : 'Leave Club'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LeaveClubModal;

