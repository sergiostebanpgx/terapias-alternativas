import { createContext, useContext, useState } from "react";

const AuthContext = createContext();
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading] = useState(false);

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE}/login.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      const isNetworkIssue = error instanceof TypeError;
      return {
        success: false,
        message: isNetworkIssue
          ? "No se pudo conectar con el servidor. Verifica que el backend esté activo en " +
            API_BASE
          : "Error inesperado al iniciar sesión.",
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
