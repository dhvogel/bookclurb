import React, { useState } from "react";
import HeaderBar from "./HeaderBar";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null); // ✅ track logged-in user

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const auth = getAuth();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, username, password);
      setUser(userCredential.user); // ✅ update state
    } catch (err) {
      setError("Login failed. Please check your credentials.");
    }
  };

  return (
    <>
      <HeaderBar user={user} /> {/* pass the state */}
      <form onSubmit={handleSubmit} style={{marginTop: '100px'}}>
        <input
          type="email"
          placeholder="Email"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
      {error && <p>{error}</p>}
    </>
  );
};

export default Login;