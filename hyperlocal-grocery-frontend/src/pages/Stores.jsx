import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";

const categories = [
  "All",
  "Fruits & Vegetables",
  "Dairy & Breakfast",
  "Snacks & Beverages",
  "Stationery",
  "Household Essentials",
  "Cleaning Supplies",
  "Personal Care",
  "Baby Care",
  "Pet Care",
  "Frozen Foods",
  "Bakery",
  "Meat & Seafood",
  "Electronics",
  "Home & Kitchen",
  "Others"
];

const Stores = () => {
  const [stores, setStores] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const API_BASE = API_BASE_URL;

  useEffect(() => {
    localStorage.removeItem("currentStoreId");
  }, []);

  useEffect(() => {
    const cached = localStorage.getItem("userLocation");

    if (cached) {
      const { lat, lng } = JSON.parse(cached);
      fetchStores(lat, lng, selectedCategory);
    } else {
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        localStorage.setItem(
          "userLocation",
          JSON.stringify({ lat, lng })
        );

        fetchStores(lat, lng, selectedCategory);
      });
    }
  }, [selectedCategory]);

  const fetchStores = async (lat, lng, category) => {
    try {
      let url = `${API_BASE}/stores/nearby?lat=${lat}&lng=${lng}`;

      if (category && category !== "All") {
        url += `&category=${encodeURIComponent(category)}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      setStores(data.stores || []);
    } catch (err) {
      console.error("FETCH STORES ERROR:", err);
    }
  };

  const filteredStores = stores.filter((store) =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🔍 Search */}
      <div className="sticky top-0 z-10 bg-white p-4 shadow">
        <input
          type="text"
          placeholder="Search stores..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 rounded-full border focus:ring-2 focus:ring-green-500 outline-none"
        />
      </div>

      {/* 🏷️ Category Filter */}
      <div className="flex gap-3 px-4 py-3 overflow-x-auto bg-white">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full whitespace-nowrap border text-sm ${
              selectedCategory === cat
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 🏪 Stores */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStores.length === 0 ? (
          <p className="text-gray-500">No stores found</p>
        ) : (
          filteredStores.map((store) => (
            <div
              key={store._id}
              className={`bg-white rounded-xl shadow p-4 ${
                store.canDeliver ? "" : "opacity-50"
              }`}
            >
              <h3 className="font-semibold text-lg">{store.name}</h3>
              <p className="text-sm text-gray-500">{store.address}</p>
              <p className="text-sm mt-1">
                Distance: {(store.distance / 1000).toFixed(2)} km
              </p>

              {store.canDeliver ? (
                <button
                  onClick={() => navigate(`/store/${store._id}`)}
                  className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg"
                >
                  View Products
                </button>
              ) : (
                <p className="mt-3 text-red-500 text-sm">
                  Out of delivery range
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Stores;
