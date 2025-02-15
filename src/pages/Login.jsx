import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost:8089/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to login");
      }
  
      const data = await response.json();
      localStorage.setItem("token", data.token);  // Save the token here
      navigate("/home");  // Redirect to profile or home page
    } catch (error) {
      console.error("Login failed:", error);
      setError("Invalid credentials");
    }
  };
  
  return (
    <div className="login-container">
      <div className="logo-container flex justify-center">
        <img
          src="/Ala-too_International_University_Seal.png"
          alt="Ala-Too Logo"
          className="w-24 h-24"
        />
      </div>

      <h2>Login</h2>

      {error && <div className="error-message">{error}</div>}

      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin} disabled={isLoading}>
        {isLoading ? "Signing In..." : "Sign In"}
      </button>

      <p>
        Don’t have an account?{" "}
        <span onClick={() => navigate("/register")}>Register</span>
      </p>
    </div>
  );
};

export default Login;
