import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import { useAuth } from "../context/AuthContext";
import "./LoginModal.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { loginAsUser } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) return;

    setError("");
    setMessage("");

    try {
      const res = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      loginAsUser(res.data.email, res.data.token, res.data.isAdmin);
      setMessage("✅ " + res.data.message);
      navigate("/account");
    } catch (err: any) {
      if (err.response?.status === 404)
        setError("User not found. Please register first.");
      else if (err.response?.status === 400)
        setError("Invalid credentials. Try again.");
      else setError("Server error. Please try later.");
    }
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) navigate(-1);
  };

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && navigate(-1);
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [navigate]);

  const isDisabled = !email || !password;

  return (
    <div className="login-wrapper" onClick={handleOverlayClick}>
      <div className="login-container">
        <div className="login-box" onClick={(e) => e.stopPropagation()}>
          <button className="close-login-btn" onClick={() => navigate(-1)}>
            <FaTimes />
          </button>

          <div className="login-content">
            <h2 className="login-title">Sign in to MegaMart</h2>

            <div className="login-fields">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {message && <p className="success-msg">{message}</p>}
            {error && <p className="error-msg">{error}</p>}

            <button
              className="login-submit"
              onClick={handleLogin}
              disabled={isDisabled}
            >
              Continue
            </button>

            <div className="login-footer">
              <p>Don’t have an account?</p>
              <span onClick={() => navigate("/register")}>Register</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
