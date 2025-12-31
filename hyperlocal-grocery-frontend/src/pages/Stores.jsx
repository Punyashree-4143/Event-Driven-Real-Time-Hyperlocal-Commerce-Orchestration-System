import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Stores = () => {
  const [stores, setStores] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const cached = localStorage.getItem("userLocation");

    if (cached) {
      const { lat, lng } = JSON.parse(cached);
      fetchStores(lat, lng);
    } else {
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        localStorage.setItem(
          "userLocation",
          JSON.stringify({ lat, lng })
        );

        fetchStores(lat, lng);
      });
    }
  }, []);

  const fetchStores = async (lat, lng) => {
    const res = await fetch(
      `http://localhost:5001/api/stores/nearby?lat=${lat}&lng=${lng}`
    );
    const data = await res.json();
    setStores(data.stores || []);
  };

  return (
    <div style={pageStyle}>
      <h2>Nearby Stores</h2>

      {stores.map((store) => (
        <div
          key={store._id}
          style={{
            ...cardStyle,
            opacity: store.canDeliver ? 1 : 0.5
          }}
        >
          <h3>{store.name}</h3>
          <p>{store.address}</p>
          <p>Distance: {(store.distance / 1000).toFixed(2)} km</p>

          {store.canDeliver ? (
            <button
              onClick={() => navigate(`/store/${store._id}`)}
            >
              View Products
            </button>
          ) : (
            <p style={{ color: "red" }}>Out of delivery range</p>
          )}
        </div>
      ))}
    </div>
  );
};

const pageStyle = {
  padding: "40px",
  minHeight: "100vh"
};

const cardStyle = {
  background: "#fff",
  padding: "16px",
  marginBottom: "15px",
  borderRadius: "8px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
};

export default Stores;
