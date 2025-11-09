import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Club } from '../../../../types';

interface EditBookReadersModalProps {
  book: {
    title: string;
    author?: string;
    readBy: string[];
  };
  club: Club;
  isOpen: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (readBy: string[]) => void;
  onDelete?: () => void;
}

const EditBookReadersModal: React.FC<EditBookReadersModalProps> = ({
  book,
  club,
  isOpen,
  saving,
  onClose,
  onSave,
  onDelete,
}) => {
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Initialize selectedMemberIds when modal opens or book changes
  useEffect(() => {
    if (isOpen) {
      setSelectedMemberIds([...book.readBy]);
    }
  }, [isOpen, book.readBy]);

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const handleSave = () => {
    onSave(selectedMemberIds);
  };

  const allMembersSelected = club.members?.every(member => 
    member && member.id && selectedMemberIds.includes(member.id)
  ) || false;

  const handleSelectAll = () => {
    if (allMembersSelected) {
      setSelectedMemberIds([]);
    } else {
      const allMemberIds = club.members
        ?.filter(member => member && member.id)
        .map(member => member.id) || [];
      setSelectedMemberIds(allMemberIds);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
          onClick={onClose}
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
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              marginBottom: '0.5rem',
              color: '#333'
            }}>
              Edit Who Read This Book
            </div>
            
            <div style={{
              marginBottom: '1.5rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid #e9ecef'
            }}>
              <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: '#333' }}>
                {book.title}
              </div>
              {book.author && (
                <div style={{ color: '#666', fontSize: '0.9rem' }}>
                  by {book.author}
                </div>
              )}
            </div>

            {club.members && club.members.length > 0 ? (
              <>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <label style={{ 
                    fontSize: '0.9rem', 
                    color: '#666', 
                    fontWeight: '500' 
                  }}>
                    Select members who read this book:
                  </label>
                  <button
                    onClick={handleSelectAll}
                    style={{
                      padding: '0.4rem 0.8rem',
                      fontSize: '0.85rem',
                      fontWeight: '500',
                      background: '#f8f9fa',
                      color: '#495057',
                      border: '1px solid #dee2e6',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e9ecef';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }}
                  >
                    {allMembersSelected ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                <div style={{ 
                  maxHeight: '300px', 
                  overflowY: 'auto',
                  marginBottom: '1.5rem',
                  padding: '0.5rem',
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  background: '#f8f9fa'
                }}>
                  {club.members
                    .filter(member => member && member.id)
                    .map((member) => {
                      const isSelected = selectedMemberIds.includes(member.id);
                      return (
                        <label
                          key={member.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '0.75rem',
                            marginBottom: '0.5rem',
                            background: isSelected ? '#e7f3ff' : 'white',
                            border: isSelected ? '2px solid #667eea' : '1px solid #e9ecef',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = '#f0f0f0';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.backgroundColor = 'white';
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMember(member.id)}
                            style={{
                              marginRight: '0.75rem',
                              width: '18px',
                              height: '18px',
                              cursor: 'pointer',
                            }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ 
                              fontWeight: isSelected ? '600' : '500',
                              color: '#333',
                              fontSize: '0.95rem'
                            }}>
                              {member.name || 'Unknown Member'}
                            </div>
                            {member.role === 'admin' && (
                              <div style={{ 
                                fontSize: '0.75rem', 
                                color: '#667eea',
                                marginTop: '0.25rem'
                              }}>
                                Admin
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                </div>

                <div style={{ 
                  fontSize: '0.85rem', 
                  color: '#666', 
                  marginBottom: '1.5rem',
                  padding: '0.75rem',
                  background: '#f8f9fa',
                  borderRadius: '6px'
                }}>
                  {selectedMemberIds.length} member{selectedMemberIds.length !== 1 ? 's' : ''} selected
                </div>
              </>
            ) : (
              <div style={{ 
                color: '#666', 
                marginBottom: '1.5rem',
                padding: '1rem',
                textAlign: 'center'
              }}>
                No members found in this club.
              </div>
            )}

            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              {onDelete && (
                <button
                  onClick={onDelete}
                  disabled={saving}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: '500',
                    background: saving ? '#ccc' : 'transparent',
                    color: saving ? '#999' : '#dc3545',
                    border: '1px solid #dc3545',
                    borderRadius: '8px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: saving ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) {
                      e.currentTarget.style.backgroundColor = '#dc3545';
                      e.currentTarget.style.color = 'white';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saving) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#dc3545';
                    }
                  }}
                >
                  Delete Book
                </button>
              )}
              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                marginLeft: onDelete ? 'auto' : '0'
              }}>
                <button
                  onClick={onClose}
                  disabled={saving}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: '500',
                    background: '#f8f9fa',
                    color: '#495057',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s ease',
                    opacity: saving ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) {
                      e.currentTarget.style.backgroundColor = '#e9ecef';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saving) {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: '500',
                    background: saving ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s ease',
                    opacity: saving ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) {
                      e.currentTarget.style.backgroundColor = '#5568d3';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saving) {
                      e.currentTarget.style.backgroundColor = '';
                    }
                  }}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EditBookReadersModal;

