import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { Leaf, Mail, Lock, ArrowRight } from "lucide-react";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await login(email, password);
    setIsLoading(false);

    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="login-page">
      {/* Background decoration */}
      <div className="login-bg" aria-hidden="true">
        <div className="bg-gradient bg-gradient-1" />
        <div className="bg-gradient bg-gradient-2" />
      </div>

      <div className="login-container">
        {/* Logo */}
        <div className="login-logo">
          <div className="logo-icon">
            <Leaf size={28} />
          </div>
          <span className="logo-text">Alternativas</span>
        </div>

        {/* Card */}
        <div className="login-card">
          <div className="card-header">
            <h1>Bienvenido</h1>
            <p>Ingresa tus credenciales para continuar</p>
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-field">
              <label htmlFor="email">Correo Electronico</label>
              <div className="input-container">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@centro.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="password">Contrasena</label>
              <div className="input-container">
                <Lock size={18} className="input-icon" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Tu contrasena"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? (
                <span className="loading-spinner" />
              ) : (
                <>
                  Iniciar Sesion
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="login-footer">
          Panel de gestion clinica
        </p>
      </div>
    </div>
  );
}
