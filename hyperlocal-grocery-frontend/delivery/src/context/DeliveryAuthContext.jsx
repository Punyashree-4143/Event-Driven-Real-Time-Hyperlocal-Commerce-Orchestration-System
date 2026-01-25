import { createContext, useState } from "react";

export const DeliveryAuthContext = createContext(null);

export const DeliveryAuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem("deliveryToken");
    return token ? { token } : null;
  });

  const login = (token) => {
    localStorage.setItem("deliveryToken", token);
    setAuth({ token });
  };

  const logout = () => {
    localStorage.removeItem("deliveryToken");
    setAuth(null);
  };

  return (
    <DeliveryAuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </DeliveryAuthContext.Provider>
  );
};
