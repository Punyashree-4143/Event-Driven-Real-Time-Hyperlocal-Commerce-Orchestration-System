import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useState } from "react";

const LocationMarker = ({ onSelect }) => {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    },
  });
  return null;
};

const MapPicker = ({ onLocationSelect }) => {
  const [position, setPosition] = useState(null);

  const handleSelect = (latlng) => {
    setPosition(latlng);

    if (typeof onLocationSelect === "function") {
      onLocationSelect({
        lat: latlng.lat,
        lng: latlng.lng,
      });
    }
  };

  return (
    <MapContainer
      center={position || { lat: 12.9716, lng: 77.5946 }} // Bangalore
      zoom={13}
      style={{ height: "300px", width: "100%" }}
    >
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <LocationMarker onSelect={handleSelect} />

      {position && <Marker position={position} />}
    </MapContainer>
  );
};

export default MapPicker;
