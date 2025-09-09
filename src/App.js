import logo from './logo.svg';
import './App.css';
import SOMBookClubHome from './components/SOMBookClubHome';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import About from './components/About';

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
      <div style={{ marginTop: "160px", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <SOMBookClubHome />
        <button
          onClick={() => navigate("/about")}
          className="mt-6 px-8 py-3 bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 text-white font-bold rounded-full shadow-lg hover:scale-105 hover:shadow-xl transition-all duration-300 border-2 border-white/30 backdrop-blur"
          style={{
            fontSize: "1.25rem",
            letterSpacing: "0.05em",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
          }}
        >
          Enter
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
