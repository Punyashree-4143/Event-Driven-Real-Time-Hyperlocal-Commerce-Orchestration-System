import { createContext, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  let parsedUser = null;

  try {
    const storedUser = localStorage.getItem("user");

    // ❗ handle "undefined", null, empty string
    if (storedUser && storedUser !== "undefined") {
      parsedUser = JSON.parse(storedUser);
    } else {
      localStorage.removeItem("user");
    }
  } catch (err) {
    // ❗ corrupted JSON → clean it
    localStorage.removeItem("user");
    parsedUser = null;
  }

  const [user, setUser] = useState(parsedUser);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
