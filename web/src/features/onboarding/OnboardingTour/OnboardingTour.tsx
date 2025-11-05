import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from 'firebase/auth';
import { Database } from 'firebase/database';

interface OnboardingTourProps {
  user: User;
  db: Database;
  onComplete: () => void;
  onSkip: () => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  illustration?: React.ReactNode;
}

const steps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Book Clurb! 📚',
    description: 'Book Clurb is an open-source platform to help you manage your book club. From organizing meetings to selecting books, we\'ve got you covered.',
    icon: '👋',
  },
  {
    id: 'create-club',
    title: 'Create Your First Club',
    description: 'Start by creating a book club. You can customize the name, description, and settings to match your club\'s style. As an admin, you\'ll manage meetings and members.',
    icon: '👥',
  },
  {
    id: 'invite-members',
    title: 'Invite Members',
    description: 'Send email invitations to friends to join your club. Members can view meetings, submit book suggestions, and track their reading progress.',
    icon: '✉️',
  },
  {
    id: 'book-voting',
    title: 'Submit & Vote on Books',
    description: 'Members can submit book suggestions. Use instant-runoff voting to fairly select your next read. View live voting results and leaderboards.',
    icon: '🗳️',
  },
  {
    id: 'reading-progress',
    title: 'Track Reading Progress',
    description: 'Set reading schedules, track progress by chapters or pages, and submit weekly reflections. See everyone\'s progress at a glance.',
    icon: '📊',
  },
  {
    id: 'meetings',
    title: 'Organize Meetings',
    description: 'Schedule meetings with reading assignments. Members can submit reflections before meetings to spark great discussions.',
    icon: '📅',
  },
];

const OnboardingTour: React.FC<OnboardingTourProps> = ({ user, db, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
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

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <AnimatePresence>
      {!isExiting && (
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
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={(e) => {
            // Close on backdrop click (optional - you might want to disable this)
            // if (e.target === e.currentTarget) {
            //   handleSkip();
            // }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              position: 'relative',
            }}
          >
            {/* Close button */}
            <button
              onClick={handleSkip}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#6b7280',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s ease',
                zIndex: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#6b7280';
              }}
              aria-label="Skip onboarding"
            >
              ×
            </button>

            {/* Progress bar */}
            <div
              style={{
                height: '4px',
                backgroundColor: '#e5e7eb',
                borderRadius: '16px 16px 0 0',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                style={{
                  height: '100%',
                  backgroundColor: '#00356B',
                  borderRadius: '16px 0 0 0',
                }}
              />
            </div>

            {/* Content */}
            <div style={{ padding: '3rem 2rem 2rem' }}>
              {/* Step indicator */}
              <div
                style={{
                  textAlign: 'center',
                  marginBottom: '2rem',
                }}
              >
                <div
                  style={{
                    fontSize: '4rem',
                    marginBottom: '1rem',
                  }}
                >
                  {currentStepData.icon}
                </div>
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: '#6b7280',
                    fontWeight: '500',
                    marginBottom: '0.5rem',
                  }}
                >
                  Step {currentStep + 1} of {steps.length}
                </div>
                <h2
                  style={{
                    fontSize: '1.75rem',
                    fontWeight: 'bold',
                    color: '#00356B',
                    margin: 0,
                    marginBottom: '1rem',
                  }}
                >
                  {currentStepData.title}
                </h2>
                <p
                  style={{
                    fontSize: '1.1rem',
                    color: '#4b5563',
                    lineHeight: '1.6',
                    margin: 0,
                    maxWidth: '500px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                  }}
                >
                  {currentStepData.description}
                </p>
              </div>

              {/* Step dots */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  marginBottom: '2rem',
                }}
              >
                {steps.map((_, index) => (
                  <div
                    key={index}
                    style={{
                      width: index === currentStep ? '24px' : '8px',
                      height: '8px',
                      borderRadius: '4px',
                      backgroundColor: index === currentStep ? '#00356B' : '#d1d5db',
                      transition: 'all 0.3s ease',
                    }}
                  />
                ))}
              </div>

              {/* Navigation buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  justifyContent: 'space-between',
                }}
              >
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '1rem',
                    fontWeight: '500',
                    color: currentStep === 0 ? '#9ca3af' : '#00356B',
                    backgroundColor: 'transparent',
                    border: `2px solid ${currentStep === 0 ? '#e5e7eb' : '#00356B'}`,
                    borderRadius: '8px',
                    cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: currentStep === 0 ? 0.5 : 1,
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

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={handleSkip}
                    style={{
                      padding: '0.75rem 1.5rem',
                      fontSize: '1rem',
                      fontWeight: '500',
                      color: '#6b7280',
                      backgroundColor: 'transparent',
                      border: '2px solid #e5e7eb',
                      borderRadius: '8px',
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
                      padding: '0.75rem 2rem',
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: 'white',
                      backgroundColor: '#00356B',
                      border: 'none',
                      borderRadius: '8px',
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
                    {currentStep === steps.length - 1 ? 'Get Started!' : 'Next'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OnboardingTour;

