import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DeliveryLogin from "./pages/DeliveryLogin";
import DeliveryOrders from "./pages/DeliveryOrders";
import { DeliveryAuthProvider, DeliveryAuthContext } from "./context/DeliveryAuthContext";
import { useContext } from "react";

const PrivateRoute = ({ children }) => {
  const { auth } = useContext(DeliveryAuthContext);
  return auth?.token ? children : <Navigate to="/" />;
};

function App() {
  return (
    <DeliveryAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DeliveryLogin />} />
          <Route
            path="/orders"
            element={
              <PrivateRoute>
                <DeliveryOrders />
              </PrivateRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </DeliveryAuthProvider>
  );
}

export default App;
