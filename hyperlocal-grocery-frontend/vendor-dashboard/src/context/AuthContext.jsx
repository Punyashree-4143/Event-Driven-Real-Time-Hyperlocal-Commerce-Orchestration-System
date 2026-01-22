import { createContext, useState } from "react";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem("vendorToken");
    return token ? { token } : null;
  });

  const login = (token) => {
    localStorage.setItem("vendorToken", token);
    setAuth({ token }); // 🔥 triggers re-render
  };

  const logout = () => {
    localStorage.removeItem("vendorToken");
    setAuth(null);
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
