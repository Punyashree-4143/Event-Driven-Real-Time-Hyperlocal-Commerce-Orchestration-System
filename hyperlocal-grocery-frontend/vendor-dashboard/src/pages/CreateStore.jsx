import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { StoreContext } from "../context/StoreContext";
import MapPicker from "../components/MapPicker";

const CreateStore = () => {
  const { store, loading, refetchStore } = useContext(StoreContext);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [deliveryRadius, setDeliveryRadius] = useState(5);

  const token = localStorage.getItem("vendorToken");

  // 🔄 WAIT FOR STORE TO LOAD
  if (loading) {
    return (
      <div className="p-8">
        <p className="text-gray-600 text-lg">Loading store...</p>
      </div>
    );
  }

  // 🏪 STORE EXISTS → SHOW DETAILS
  if (store) {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">My Store</h1>

        {store.status === "pending" && (
          <div className="bg-yellow-100 border border-yellow-300 p-4 rounded mb-6">
            <p className="font-semibold text-yellow-700">
              Your store is under review ⏳
            </p>
          </div>
        )}

        {store.status === "approved" && (
          <div className="bg-green-100 border border-green-300 p-4 rounded mb-6">
            <p className="font-semibold text-green-700">
              Your store is approved 🎉
            </p>
          </div>
        )}

        <div className="bg-white shadow rounded p-6 space-y-3">
          <p><b>Store Name:</b> {store.name}</p>
          <p><b>Address:</b> {store.address}</p>
          <p><b>Delivery Radius:</b> {store.deliveryRadius} km</p>
          <p><b>Latitude:</b> {store.location.coordinates[1]}</p>
          <p><b>Longitude:</b> {store.location.coordinates[0]}</p>
          <p>
            <b>Status:</b>{" "}
            <span
              className={
                store.status === "approved"
                  ? "text-green-600 font-semibold"
                  : "text-yellow-600 font-semibold"
              }
            >
              {store.status}
            </span>
          </p>
        </div>
      </div>
    );
  }

  // 📍 MAP LOCATION HANDLER
  const handleLocationSelect = ({ lat, lng }) => {
    setLat(lat);
    setLng(lng);
  };

  // 🆕 CREATE STORE
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!lat || !lng) {
      alert("Please pick store location on map");
      return;
    }

    try {
      const res = await fetch("http://localhost:5001/api/stores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          address,
          location: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)],
          },
          deliveryRadius,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Failed to create store");
        return;
      }

      await refetchStore();
      navigate("/");
    } catch (error) {
      alert("Server error");
    }
  };

  // 📝 CREATE STORE FORM
  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold mb-6">Create Store</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          placeholder="Store Name"
          className="w-full p-2 border rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          placeholder="Address"
          className="w-full p-2 border rounded"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />

        {/* MAP PICKER */}
        <div>
          <label className="block font-semibold mb-2">
            Pick Store Location
          </label>
          <MapPicker onLocationSelect={handleLocationSelect} />
        </div>

        {/* SELECTED COORDINATES */}
        <div className="grid grid-cols-2 gap-4">
          <input
            value={lat}
            readOnly
            placeholder="Latitude"
            className="w-full p-2 border rounded bg-gray-100"
          />
          <input
            value={lng}
            readOnly
            placeholder="Longitude"
            className="w-full p-2 border rounded bg-gray-100"
          />
        </div>

        <input
          type="number"
          placeholder="Delivery Radius (km)"
          className="w-full p-2 border rounded"
          value={deliveryRadius}
          onChange={(e) => setDeliveryRadius(e.target.value)}
          required
        />

        <button className="bg-green-600 text-white px-4 py-2 rounded w-full">
          Create Store
        </button>
      </form>
    </div>
  );
};

export default CreateStore;
