import logo from './logo.svg';
import './App.css';
import Home from './components/Home';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import People from './components/People';
import Login from './components/Login';
import { db } from "./firebaseConfig"; // make sure this runs before using any Firebase services
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import Profile from './components/Profile';
import Meetings from './components/Meetings';
import LiteraryProfile from './components/LiteraryProfile';
import Clubs from './components/Clubs';
import { ClubPage } from './features';

function App() {
  const [user, setUser] = useState<User | null>(null); // Parent holds the state
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser); // null if not logged in
    });
    return () => unsubscribe();
  }, [auth]);
            
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home user={user} db={db} />} />
        <Route path="/people" element={<People user={user} db={db} />} />
        <Route path="/profile" element={<Profile user={user} db={db} />} />
        <Route path="/login" element={<Login setUser={setUser} user={user} db={db} auth={auth} />} />
        <Route path="/meetings" element={<Meetings user={user} db={db} />} />
        <Route path="/literary-profile" element={<LiteraryProfile user={user} db={db} />} />
        <Route path="/clubs" element={<Clubs user={user} db={db} />} />
        <Route path="/clubs/:clubId" element={<ClubPage user={user} db={db} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
