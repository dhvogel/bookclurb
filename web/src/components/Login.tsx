import React, { useState } from "react";
import HeaderBar from "./HeaderBar";
import { getAuth, signInWithEmailAndPassword, Auth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { LoginProps } from "../types";

const Login: React.FC<LoginProps> = ({ setUser, user, auth, db }) => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        username,
        password
      );
      setUser(userCredential.user); // ✅ update state
      navigate("/profile"); // ✅ redirect to profile
    } catch (err) {
      setError("Login failed. Please check your credentials.");
    }
  };

  return (
    <>
      <HeaderBar user={user} db={db} /> {/* pass the state */}
      <form
        onSubmit={handleSubmit}
        style={{
          marginTop: "200px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
        }}
      >
      {/* TODO: Add a Google login button*/}
        <input
          type="email"
          placeholder="Email"
          value={username}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
      {error && <p>{error}</p>}
    </>
  );
};

export default Login;
