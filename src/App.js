import logo from './logo.svg';
import './App.css';
import SOMBookClubHome from './components/SOMBookClubHome';

function App() {
  return (
    <div className="App"     style={{
    margin: 0,
    padding: 0,
    width: "100vw",
    height: "100vh",
    backgroundImage: "url('/storm-photo.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  }}>
      <SOMBookClubHome />
    </div>
  );
}

export default App;
