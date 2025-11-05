import logo from './logo.svg';
import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Signup from './components/Signup';
import { db } from "./firebaseConfig"; // make sure this runs before using any Firebase services
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import Clubs from './components/Clubs';
import { ClubPage, ProfilePage, LoginPage, BlogList, BlogPost, HomePage, SpotlightTour, useOnboarding } from './features';

function App() {
  const [user, setUser] = useState<User | null>(null); // Parent holds the state
  const auth = getAuth();
  const { needsOnboarding, loading: onboardingLoading, markOnboardingComplete } = useOnboarding(user, db);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser); // null if not logged in
    });
    return () => unsubscribe();
  }, [auth]);

  const handleOnboardingComplete = async () => {
    if (user) {
      try {
        await markOnboardingComplete();
      } catch (error) {
        console.error('Failed to mark onboarding as complete:', error);
      }
    }
  };

  const handleOnboardingSkip = async () => {
    if (user) {
      try {
        await markOnboardingComplete();
      } catch (error) {
        console.error('Failed to mark onboarding as complete:', error);
      }
    }
  };
            
  return (
    <BrowserRouter>
      {user && !onboardingLoading && needsOnboarding && (
        <SpotlightTour
          user={user}
          db={db}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
      <Routes>
        <Route path="/" element={<HomePage user={user} db={db} />} />
        <Route path="/profile" element={<ProfilePage user={user} db={db} />} />
        <Route path="/login" element={<LoginPage setUser={setUser} user={user} db={db} auth={auth} />} />
        <Route path="/signup" element={<Signup user={user} db={db} />} />
        <Route path="/clubs" element={<Clubs user={user} db={db} />} />
        <Route path="/clubs/:clubId" element={<ClubPage user={user} db={db} />} />
        <Route path="/blog" element={<BlogList user={user} db={db} />} />
        <Route path="/blog/:slug" element={<BlogPost user={user} db={db} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
