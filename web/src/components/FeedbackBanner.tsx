import React, { useState, useEffect } from 'react';

const FeedbackBanner: React.FC = () => {
  const [isDismissed, setIsDismissed] = useState(false);

  // Update CSS variable for banner height when banner is shown/hidden
  useEffect(() => {
    if (!isDismissed) {
      document.documentElement.style.setProperty('--feedback-banner-height', '60px');
    } else {
      document.documentElement.style.setProperty('--feedback-banner-height', '0px');
    }
  }, [isDismissed]);

  if (isDismissed) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: '60px', // Below the header
        left: 0,
        right: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '0.75rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        zIndex: 999,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        fontSize: '1rem',
        fontWeight: '600',
        lineHeight: '1.5',
        minHeight: '60px'
      }}
    >
      <div style={{ flex: 1, textAlign: 'center' }}>
        Hello BookClurb visitor, we are looking for feedback! Please, fill out a{' '}
        <a 
          href="https://forms.gle/kXAQCacwepZiBWJg8" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ 
            color: 'white', 
            textDecoration: 'underline',
            fontWeight: '700'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
        >
          feedback form
        </a>
        {' '}to let us know what you think. Thank you!
      </div>
      <button
        onClick={() => setIsDismissed(true)}
        style={{
          background: 'transparent',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          color: 'white',
          borderRadius: '4px',
          padding: '0.25rem 0.5rem',
          cursor: 'pointer',
          fontSize: '0.85rem',
          transition: 'all 0.2s',
          flexShrink: 0
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.8)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
        }}
      >
        ×
      </button>
      <style>{`
        @media (max-width: 768px) {
          .feedback-banner {
            font-size: 0.8rem;
            padding: 0.5rem 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default FeedbackBanner;

