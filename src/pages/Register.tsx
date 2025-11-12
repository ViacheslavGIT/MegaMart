import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api/api"
import { useAuth } from "../context/AuthContext"
import { FaTimes } from "react-icons/fa"
import "./LoginModal.css"

const Register: React.FC = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const { loginAsUser } = useAuth()

  const handleRegister = async () => {
    setError("")
    setMessage("")

    if (!email || !password) {
      setError("Please fill in both fields.")
      return
    }

    try {
      const res = await api.post("/auth/register", { email, password })
      localStorage.setItem("token", res.data.token)
      loginAsUser(res.data.email)
      setMessage("✅ " + res.data.message)
      navigate("/account")
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed")
    }
  }

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && navigate(-1)
    window.addEventListener("keydown", onEsc)
    return () => window.removeEventListener("keydown", onEsc)
  }, [navigate])

  return (
    <div className="login-wrapper" onClick={(e) => e.target === e.currentTarget && navigate(-1)}>
      <div className="login-container">
        <div className="login-box" onClick={(e) => e.stopPropagation()}>
          <button className="close-login-btn" onClick={() => navigate(-1)}>
            <FaTimes />
          </button>

          <div className="login-content">
            <h2 className="login-title">Create your account</h2>

            <div className="login-fields">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Create password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {message && <p className="success-msg">{message}</p>}
            {error && <p className="error-msg">{error}</p>}

            <button className="login-submit" onClick={handleRegister}>
              Sign up
            </button>

            <div className="login-footer">
              <p>Already have an account?</p>
              <span onClick={() => navigate("/login")}>Sign in</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
