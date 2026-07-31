import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from "react-leaflet";
import { useState, useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet Default Icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const storeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [lat, lng, map]);
  return null;
};

const LocationMarker = ({ position, onSelect }) => {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    },
  });

  return position ? (
    <Marker
      position={position}
      icon={storeIcon}
      draggable={true}
      eventHandlers={{
        dragend(e) {
          onSelect(e.target.getLatLng());
        }
      }}
    />
  ) : null;
};

const MapPicker = ({ initialLat, initialLng, deliveryRadius = 5, onSelect }) => {
  const [position, setPosition] = useState(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  );

  useEffect(() => {
    if (initialLat && initialLng) {
      setPosition({ lat: initialLat, lng: initialLng });
    }
  }, [initialLat, initialLng]);

  const handleSelect = (latlng) => {
    setPosition(latlng);
    if (typeof onSelect === "function") {
      onSelect({
        lat: latlng.lat,
        lng: latlng.lng,
      });
    }
  };

  const center = position || { lat: 12.9716, lng: 77.5946 }; // Bangalore default

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={13}
      style={{ height: "100%", width: "100%", zIndex: 0 }}
    >
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <LocationMarker position={position} onSelect={handleSelect} />

      {position && (
        <Circle
          center={[position.lat, position.lng]}
          radius={deliveryRadius * 1000} // km to meters
          pathOptions={{ fillColor: "rgba(34, 197, 94, 0.2)", color: "#22c55e", weight: 2 }}
        />
      )}

      {position && <RecenterMap lat={position.lat} lng={position.lng} />}
    </MapContainer>
  );
};

export default MapPicker;
