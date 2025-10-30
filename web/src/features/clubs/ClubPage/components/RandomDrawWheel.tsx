import React, { useState, useEffect } from 'react';
import { BookSubmission } from '../../../../types';

interface RandomDrawWheelProps {
  submissions: BookSubmission[];
  isOpen: boolean;
  onClose: () => void;
  onSelect: (submission: BookSubmission) => void;
}

const RandomDrawWheel: React.FC<RandomDrawWheelProps> = ({
  submissions,
  isOpen,
  onClose,
  onSelect
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [currentDisplayIndex, setCurrentDisplayIndex] = useState(0);
  const [countdown, setCountdown] = useState(3);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && submissions.length > 0) {
      setHasStarted(false);
      setIsAnimating(false);
      setSelectedIndex(null);
      setCurrentDisplayIndex(0);
      setCountdown(3);
    } else if (!isOpen) {
      setHasStarted(false);
      setIsAnimating(false);
      setSelectedIndex(null);
      setCurrentDisplayIndex(0);
      setCountdown(3);
    }
  }, [isOpen, submissions.length]);

  // Start the dramatic selection animation
  const startSelection = () => {
    if (submissions.length === 0) return;
    
    setHasStarted(true);
    setIsAnimating(true);
    setSelectedIndex(null);
    setCurrentDisplayIndex(0);
    
    // Randomly select a book (decided before animation)
    // Use Math.random() - it's sufficient for this use case
    const randomIndex = Math.floor(Math.random() * submissions.length);
    setSelectedIndex(randomIndex);
    
    console.log('Random selection:', { 
      randomIndex, 
      totalSubmissions: submissions.length,
      selectedBook: submissions[randomIndex]?.bookDetails.title 
    });
    
    // Countdown animation
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          startRapidSelection(randomIndex);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Rapid cycling through books before landing on selected one
  const startRapidSelection = (targetIndex: number) => {
    let cycleCount = 0;
    const maxCycles = 15; // Number of rapid cycles
    const cycleInterval = setInterval(() => {
      setCurrentDisplayIndex(prev => (prev + 1) % submissions.length);
      cycleCount++;
      
      if (cycleCount >= maxCycles) {
        clearInterval(cycleInterval);
        // Land on the selected book
        setCurrentDisplayIndex(targetIndex);
        setIsAnimating(false);
        
        // Wait a moment before calling onSelect for dramatic effect
        setTimeout(() => {
          onSelect(submissions[targetIndex]);
          // Show the result for 5 seconds before closing
          setTimeout(() => {
            onClose();
          }, 5000);
        }, 1000);
      }
    }, 150); // Speed of cycling
  };

  if (!isOpen || submissions.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      animation: 'fadeIn 0.3s ease-in'
    }}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(102, 126, 234, 0.5); }
          50% { box-shadow: 0 0 40px rgba(102, 126, 234, 0.8), 0 0 60px rgba(102, 126, 234, 0.6); }
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
      `}</style>
      
      <div style={{
        position: 'relative',
        width: '90vw',
        maxWidth: '600px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem'
      }}>
        {/* Title */}
        <h2 style={{
          color: 'white',
          fontSize: '2.5rem',
          fontWeight: 'bold',
          textAlign: 'center',
          margin: 0,
          textShadow: '0 2px 10px rgba(0,0,0,0.3)',
          animation: hasStarted ? 'none' : 'pulse 2s ease-in-out infinite'
        }}>
          🎲 Random Draw
        </h2>

        {/* Countdown */}
        {hasStarted && countdown > 0 && (
          <div style={{
            fontSize: '8rem',
            fontWeight: 'bold',
            color: '#667eea',
            textShadow: '0 0 30px rgba(102, 126, 234, 0.8)',
            animation: 'bounce 0.6s ease-in-out infinite'
          }}>
            {countdown}
          </div>
        )}

        {/* Book Selection Display - only show after countdown */}
        {hasStarted && countdown === 0 && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.95) 0%, rgba(118, 75, 162, 0.95) 100%)',
            padding: '2rem 2.5rem',
            borderRadius: '20px',
            textAlign: 'center',
            animation: isAnimating ? 'shake 0.1s ease-in-out infinite' : 'glow 2s ease-in-out infinite',
            boxShadow: isAnimating 
              ? '0 8px 30px rgba(0,0,0,0.4), 0 0 40px rgba(102, 126, 234, 0.5)' 
              : '0 8px 30px rgba(0,0,0,0.4), 0 0 40px rgba(102, 126, 234, 0.8)',
            color: 'white',
            maxWidth: '500px',
            width: '100%',
            border: isAnimating ? '3px solid #667eea' : '3px solid rgba(255,255,255,0.3)',
            transition: 'all 0.3s ease'
          }}>
            {/* Book Cover */}
            {submissions[currentDisplayIndex]?.bookDetails.coverUrl && (
              <div style={{
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'center'
              }}>
                <img
                  src={submissions[currentDisplayIndex].bookDetails.coverUrl}
                  alt={submissions[currentDisplayIndex].bookDetails.title}
                  style={{
                    width: '120px',
                    height: '180px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                    border: '3px solid rgba(255,255,255,0.3)',
                    animation: isAnimating ? 'bounce 0.2s ease-in-out infinite' : 'none'
                  }}
                />
              </div>
            )}
            
            <div style={{ 
              fontSize: '0.9rem', 
              marginBottom: '0.75rem', 
              opacity: 0.95, 
              fontWeight: '500', 
              textTransform: 'uppercase', 
              letterSpacing: '1px' 
            }}>
              {isAnimating ? 'Selecting...' : 'Selected Book'}
            </div>
            
            <h3 style={{ 
              margin: '0 0 0.75rem 0', 
              color: 'white', 
              fontSize: '1.8rem',
              fontWeight: 'bold',
              textShadow: '0 2px 10px rgba(0,0,0,0.2)',
              lineHeight: '1.3',
              minHeight: '2.3em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {submissions[currentDisplayIndex]?.bookDetails.title || 'Loading...'}
            </h3>
            
            <p style={{ 
              margin: '0 0 1rem 0', 
              color: 'rgba(255,255,255,0.9)', 
              fontSize: '1.2rem',
              minHeight: '1.2em'
            }}>
              by {submissions[currentDisplayIndex]?.bookDetails.author || 'Unknown Author'}
            </p>
            
            {!isAnimating && selectedIndex !== null && (
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                padding: '0.75rem 1.5rem',
                borderRadius: '12px',
                display: 'inline-block',
                marginTop: '0.5rem',
                border: '2px solid rgba(255,255,255,0.3)',
                animation: 'bounce 1s ease-in-out infinite'
              }}>
                <span style={{ fontSize: '1rem', fontWeight: '600' }}>🎉 Winner! 📌 On Deck</span>
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        {!hasStarted && (
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={startSelection}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                padding: '1.2rem 2.5rem',
                borderRadius: '15px',
                fontSize: '1.3rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.4)',
                transform: 'translateY(0)',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
              }}
            >
              🎯 Start Selection!
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.5)',
                padding: '1.2rem 2.5rem',
                borderRadius: '15px',
                fontSize: '1.3rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                e.currentTarget.style.transform = 'translateY(-3px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RandomDrawWheel;