import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'firebase/auth';
import { Database } from 'firebase/database';
import { useLocation, useNavigate } from 'react-router-dom';

interface SpotlightTourProps {
  user: User;
  db: Database;
  onComplete: () => void;
  onSkip: () => void;
}

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  route?: string; // Navigate to this route before showing step
  waitForElement?: number; // Wait time in ms for element to appear
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Book Clurb! 📚',
    description: 'Let\'s take a quick tour of the key features. This will only take a minute!',
    target: 'body',
    position: 'center',
  },
  {
    id: 'navigation',
    title: 'Navigation',
    description: 'Use the navigation bar to access your clubs, profile, and blog. The "Clubs" link takes you to all your book clubs.',
    target: '[data-tour="clubs-nav"]',
    position: 'bottom',
    route: '/',
  },
  {
    id: 'create-club',
    title: 'Create Your First Club',
    description: 'Click the "Create Club" button to start a new book club. You\'ll be the admin and can invite members!',
    target: '[data-tour="create-club-button"]',
    position: 'bottom',
    route: '/clubs',
  },
  {
    id: 'profile',
    title: 'Your Profile',
    description: 'Access your profile to see all your clubs, manage your account, and view your reading history.',
    target: '[data-tour="profile-link"]',
    position: 'bottom',
    route: '/clubs',
  },
];

const SpotlightTour: React.FC<SpotlightTourProps> = ({ user, db, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStepData = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  useEffect(() => {
    if (isExiting) return;

    const updateHighlight = () => {
      let element: HTMLElement | null = null;

      // Special handling for center position (welcome step)
      if (currentStepData.position === 'center') {
        setHighlightRect(null);
        setTooltipPosition({ top: window.innerHeight / 2, left: window.innerWidth / 2 });
        return;
      }

      // Try to find element by selector
      try {
        element = document.querySelector(currentStepData.target) as HTMLElement;
        
        // Fallback: if using data-tour attribute and not found, try finding by text content
        if (!element && currentStepData.target.includes('create-club')) {
          const buttons = Array.from(document.querySelectorAll('button'));
          element = buttons.find(btn => btn.textContent?.includes('Create Club')) || null;
        }
      } catch (e) {
        console.warn('Could not find element:', currentStepData.target);
      }

      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightRect(rect);
        calculateTooltipPosition(rect, currentStepData.position || 'bottom');
      } else {
        // Element not found - wait and retry
        if (currentStepData.waitForElement) {
          setTimeout(updateHighlight, currentStepData.waitForElement);
        } else {
          setTimeout(updateHighlight, 100);
        }
      }
    };

    // Navigate to the route if specified
    if (currentStepData.route && location.pathname !== currentStepData.route) {
      navigate(currentStepData.route);
      // Wait for navigation to complete
      setTimeout(updateHighlight, 500);
    } else {
      updateHighlight();
    }

    // Update on scroll/resize
    const handleUpdate = () => updateHighlight();
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [currentStep, currentStepData, location.pathname, navigate, isExiting]);

  const calculateTooltipPosition = (rect: DOMRect, position: 'top' | 'bottom' | 'left' | 'right' | 'center') => {
    if (!tooltipRef.current) return;

    const tooltipWidth = 320;
    const tooltipHeight = 200;
    const spacing = 20;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'bottom':
        top = rect.bottom + spacing;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'top':
        top = rect.top - tooltipHeight - spacing;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + spacing;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - spacing;
        break;
      case 'center':
        top = window.innerHeight / 2;
        left = window.innerWidth / 2;
        break;
    }

    // Keep tooltip within viewport
    left = Math.max(10, Math.min(left, window.innerWidth - tooltipWidth - 10));
    top = Math.max(10, Math.min(top, window.innerHeight - tooltipHeight - 10));

    setTooltipPosition({ top, left });
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsExiting(true);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(() => {
      onSkip();
    }, 300);
  };

  if (isExiting) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          pointerEvents: 'auto',
        }}
      >
        {/* Light overlay with cutout - only dims slightly */}
        {highlightRect && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
            }}
          >
            {/* Top overlay */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${highlightRect.top - 10}px`,
                backgroundColor: 'rgba(0, 0, 0, 0.15)',
              }}
            />
            {/* Bottom overlay */}
            <div
              style={{
                position: 'absolute',
                top: `${highlightRect.bottom + 10}px`,
                left: 0,
                width: '100%',
                height: `${window.innerHeight - highlightRect.bottom - 10}px`,
                backgroundColor: 'rgba(0, 0, 0, 0.15)',
              }}
            />
            {/* Left overlay */}
            <div
              style={{
                position: 'absolute',
                top: `${highlightRect.top - 10}px`,
                left: 0,
                width: `${highlightRect.left - 10}px`,
                height: `${highlightRect.height + 20}px`,
                backgroundColor: 'rgba(0, 0, 0, 0.15)',
              }}
            />
            {/* Right overlay */}
            <div
              style={{
                position: 'absolute',
                top: `${highlightRect.top - 10}px`,
                left: `${highlightRect.right + 10}px`,
                width: `${window.innerWidth - highlightRect.right - 10}px`,
                height: `${highlightRect.height + 20}px`,
                backgroundColor: 'rgba(0, 0, 0, 0.15)',
              }}
            />
          </div>
        )}

        {/* Highlight border */}
        {highlightRect && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              left: highlightRect.left - 10,
              top: highlightRect.top - 10,
              width: highlightRect.width + 20,
              height: highlightRect.height + 20,
              border: '3px solid #00356B',
              borderRadius: '8px',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.15), 0 0 20px rgba(0, 53, 107, 0.5)',
              pointerEvents: 'none',
              zIndex: 10000,
            }}
          />
        )}

        {/* Tooltip */}
        {tooltipPosition && (
          <motion.div
            ref={tooltipRef}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              top: tooltipPosition.top,
              left: tooltipPosition.left,
              width: '320px',
              maxWidth: '90vw',
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              zIndex: 10001,
              pointerEvents: 'auto',
              transform: currentStepData.position === 'center' ? 'translate(-50%, -50%)' : 'none',
            }}
          >
            {/* Progress bar */}
            <div
              style={{
                height: '4px',
                backgroundColor: '#e5e7eb',
                borderRadius: '4px',
                marginBottom: '1rem',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                style={{
                  height: '100%',
                  backgroundColor: '#00356B',
                  borderRadius: '4px',
                }}
              />
            </div>

            {/* Step indicator */}
            <div
              style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                fontWeight: '500',
                marginBottom: '0.5rem',
              }}
            >
              Step {currentStep + 1} of {tourSteps.length}
            </div>

            {/* Title */}
            <h3
              style={{
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#00356B',
                margin: '0 0 0.75rem 0',
              }}
            >
              {currentStepData.title}
            </h3>

            {/* Description */}
            <p
              style={{
                fontSize: '0.95rem',
                color: '#4b5563',
                lineHeight: '1.6',
                margin: '0 0 1.5rem 0',
              }}
            >
              {currentStepData.description}
            </p>

            {/* Navigation buttons */}
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'space-between',
              }}
            >
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: currentStep === 0 ? '#9ca3af' : '#00356B',
                  backgroundColor: 'transparent',
                  border: `2px solid ${currentStep === 0 ? '#e5e7eb' : '#00356B'}`,
                  borderRadius: '6px',
                  cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                  opacity: currentStep === 0 ? 0.5 : 1,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (currentStep > 0) {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentStep > 0) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                Previous
              </button>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handleSkip}
                  style={{
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#6b7280',
                    backgroundColor: 'transparent',
                    border: '2px solid #e5e7eb',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Skip Tour
                </button>

                <button
                  onClick={handleNext}
                  style={{
                    padding: '0.5rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'white',
                    backgroundColor: '#00356B',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(0, 53, 107, 0.2)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#00509E';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 53, 107, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#00356B';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 53, 107, 0.2)';
                  }}
                >
                  {currentStep === tourSteps.length - 1 ? 'Get Started!' : 'Next'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default SpotlightTour;

