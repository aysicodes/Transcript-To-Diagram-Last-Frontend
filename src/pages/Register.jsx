import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { apiRequest } from "../services/apiRequest";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      let responseData;
      const contentType = response.headers.get("Content-Type");

      // Проверяем, JSON ли вернул сервер
      if (contentType && contentType.includes("application/json")) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        throw new Error(responseData.error || responseData || "Registration failed");
      }

      console.log("Регистрация успешна:", responseData);
      
      // Save email and password to localStorage for first-time login auto-fill
      localStorage.setItem("email", email);
      localStorage.setItem("password", password);

      navigate("/login"); // Перенаправление на страницу home после успешной регистрации
    } catch (error) {
      console.error("Ошибка регистрации:", error.message);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="logo-container flex justify-center">
        <img
          src="/Ala-too_International_University_Seal.png"
          alt="Ala-Too Logo"
          className="w-24 h-24"
        />
      </div>

      <h2>Register</h2>

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

      <button onClick={handleRegister} disabled={loading}>
        {loading ? "Registering..." : "Register Now"}
      </button>

      <p>
        Already have an account?{" "}
        <span onClick={() => navigate("/login")}>Login</span>
      </p>
    </div>
  );
}

export default Register;
