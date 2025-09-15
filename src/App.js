import logo from './logo.svg';
import './App.css';
import SOMBookClubHome from './components/SOMBookClubHome';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import People from './components/People';
import Login from './components/Login';
import "./firebaseConfig"; // make sure this runs before using any Firebase services
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Profile from './components/Profile';
import Meetings from './components/Meetings';

function Home() {
  const navigate = useNavigate();

  return (
    <div
      className="App"
      style={{
        margin: 0,
        padding: 0,
        width: "100vw",
        height: "100vh",
        backgroundImage: "url('/storm-photo.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
      <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <SOMBookClubHome />
        <button
          onClick={() => navigate("/people")}
          className="mt-6 px-8 py-3 bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white font-bold rounded-full shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300 border-2 border-white/30 backdrop-blur"
          style={{
            fontSize: "1.25rem",
            letterSpacing: "0.05em",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            position: "absolute",
            bottom: "3%", // distance from bottom of container
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          Enter
        </button>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null); // Parent holds the state

  useEffect(() => {
    const auth = getAuth();
    // Subscribe to auth state changes (runs once on mount)
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser); // null if signed out
    });

    return () => unsubscribe(); // cleanup
  }, []);
            
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/people" element={<People user={user} />} />
        <Route path="/profile" element={<Profile user={user} />} />
        <Route path="/login" element={<Login setUser={setUser} user={user} />} />
        <Route path="/meetings" element={<Meetings user={user} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
