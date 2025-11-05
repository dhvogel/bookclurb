import { useState, useEffect } from 'react';
import { ref, get, update } from 'firebase/database';
import { Database } from 'firebase/database';
import { User } from 'firebase/auth';

export const useOnboarding = (user: User | null, db: Database | null) => {
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) {
      setNeedsOnboarding(false);
      setLoading(false);
      return;
    }

    const checkOnboardingStatus = async () => {
      try {
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();

        // If user data exists and onboarding_completed is true, they don't need onboarding
        // Otherwise, they need onboarding (new users or existing users without the flag)
        const completed = userData?.onboarding_completed === true;
        setNeedsOnboarding(!completed);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // On error, assume they need onboarding to be safe
        setNeedsOnboarding(true);
      } finally {
        setLoading(false);
      }
    };

    checkOnboardingStatus();
  }, [user, db]);

  const markOnboardingComplete = async () => {
    if (!user || !db) {
      return;
    }

    try {
      const userRef = ref(db, `users/${user.uid}`);
      await update(userRef, {
        onboarding_completed: true,
        onboarding_completed_at: Date.now(),
      });
      setNeedsOnboarding(false);
    } catch (error) {
      console.error('Error marking onboarding as complete:', error);
      throw error;
    }
  };

  return {
    needsOnboarding,
    loading,
    markOnboardingComplete,
  };
};

