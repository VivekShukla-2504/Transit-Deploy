import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Compass, Maximize2, Truck, Navigation } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const CITY_COORDS = {
  delhi: [28.6139, 77.2090],
  noida: [28.5355, 77.3910],
  gurugram: [28.4595, 77.0266],
  gurgaon: [28.4595, 77.0266],
  ghaziabad: [28.6692, 77.4538],
  faridabad: [28.4089, 77.3178],
  mumbai: [19.0760, 72.8777],
  thane: [19.2183, 72.9781],
  'navi mumbai': [19.0330, 73.0297],
  pune: [18.5204, 73.8567],
  bengaluru: [12.9716, 77.5946],
  bangalore: [12.9716, 77.5946],
  chennai: [13.0827, 80.2707],
  hyderabad: [17.3850, 78.4867],
  kolkata: [22.5726, 88.3639],
  ahmedabad: [23.0225, 72.5714],
  surat: [21.1702, 72.8311],
  vadodara: [22.3072, 73.1812],
  rajkot: [22.3039, 70.8022],
  jaipur: [26.9124, 75.7873],
  chandigarh: [30.7333, 76.7794],
  ludhiana: [30.9010, 75.8573],
  amritsar: [31.6340, 74.8723],
  lucknow: [26.8467, 80.9462],
  kanpur: [26.4499, 80.3319],
  agra: [27.1767, 78.0081],
  varanasi: [25.3176, 82.9739],
  patna: [25.5941, 85.1376],
  nagpur: [21.1458, 79.0882],
  bhopal: [23.2599, 77.4126],
  indore: [22.7196, 75.8577],
  kochi: [9.9312, 76.2673],
  coimbatore: [11.0168, 76.9558],
  visakhapatnam: [17.6868, 83.2185],
  vizag: [17.6868, 83.2185],
};

function getCityCoords(name, idx = 0) {
  if (!name) return [28.6139 + idx * 0.03, 77.2090 + idx * 0.03];
  const q = name.toLowerCase();
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (q.includes(city)) {
      return [coords[0] + (idx % 4) * 0.015, coords[1] + (idx % 4) * 0.015];
    }
  }

  if (q.includes('north')) return [28.6139 + (idx % 4) * 0.02, 77.2090 + (idx % 4) * 0.02];
  if (q.includes('west')) return [19.0760 + (idx % 4) * 0.02, 72.8777 + (idx % 4) * 0.02];
  if (q.includes('south')) return [12.9716 + (idx % 4) * 0.02, 77.5946 + (idx % 4) * 0.02];
  if (q.includes('east')) return [22.5726 + (idx % 4) * 0.02, 88.3639 + (idx % 4) * 0.02];
  if (q.includes('central')) return [21.1458 + (idx % 4) * 0.02, 79.0882 + (idx % 4) * 0.02];

  return [28.6139 + (idx % 6) * 0.025, 77.2090 + (idx % 6) * 0.025];
}

const STATE_DEFAULT_COORDS = {
  dl: [28.6139, 77.2090], // Delhi Hub
  mh: [19.0760, 72.8777], // Mumbai / Maharashtra
  ka: [12.9716, 77.5946], // Bengaluru / Karnataka
  tn: [13.0827, 80.2707], // Chennai / Tamil Nadu
  ts: [17.3850, 78.4867], // Hyderabad / Telangana
  ap: [17.6868, 83.2185], // Visakhapatnam / Andhra Pradesh
  wb: [22.5726, 88.3639], // Kolkata / West Bengal
  gj: [23.0225, 72.5714], // Ahmedabad / Gujarat
  rj: [26.9124, 75.7873], // Jaipur / Rajasthan
  up: [26.8467, 80.9462], // Lucknow / Uttar Pradesh
  hr: [28.4595, 77.0266], // Gurugram / Haryana
  pb: [30.7333, 76.7794], // Chandigarh / Punjab
  mp: [23.2599, 77.4126], // Bhopal / Madhya Pradesh
  kl: [9.9312, 76.2673],  // Kochi / Kerala
};

function getVehicleCoords(vehicle, activeTrip, idx = 0) {
  // 1. If actively dispatched on a trip, position 60% along the trip route
  if (activeTrip && activeTrip.source && activeTrip.destination) {
    const src = getCityCoords(activeTrip.source, idx);
    const dst = getCityCoords(activeTrip.destination, idx);
    return [src[0] * 0.4 + dst[0] * 0.6, src[1] * 0.4 + dst[1] * 0.6];
  }

  // 2. If vehicle has a specified valid region
  if (vehicle.region && vehicle.region !== 'Unassigned') {
    const coords = getCityCoords(vehicle.region, idx);
    const angle = (idx * 1.25) % (2 * Math.PI);
    const dist = 0.035 * (1 + (idx % 3));
    return [coords[0] + Math.sin(angle) * dist, coords[1] + Math.cos(angle) * dist];
  }

  // 3. Fallback to vehicle registration number state code prefix (e.g. DL, MH, KA)
  if (vehicle.registrationNumber) {
    const prefix = vehicle.registrationNumber.slice(0, 2).toLowerCase();
    if (STATE_DEFAULT_COORDS[prefix]) {
      const base = STATE_DEFAULT_COORDS[prefix];
      const angle = (idx * 1.25) % (2 * Math.PI);
      const dist = 0.035 * (1 + (idx % 3));
      return [base[0] + Math.sin(angle) * dist, base[1] + Math.cos(angle) * dist];
    }
  }

  // 4. Default staggered position across India
  const base = [28.6139, 77.2090];
  const angle = (idx * 1.25) % (2 * Math.PI);
  const dist = 0.045 * (1 + (idx % 4));
  return [base[0] + Math.sin(angle) * dist, base[1] + Math.cos(angle) * dist];
}

export default function FleetMap({ vehicles = [], trips = [], height = '450px' }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const routesLayerRef = useRef(null);
  const vehicleMarkersMap = useRef(new Map());
  const vehicleCoordsMap = useRef(new Map());
  const { theme } = useTheme();

  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'ON_TRIP' | 'AVAILABLE' | 'IN_SHOP'
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Default center of India
    const map = L.map(mapContainerRef.current, {
      center: [22.9734, 78.6569],
      zoom: 5,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Standard OpenStreetMap Tile Server - 100% Free, Zero API Keys, Zero Watermarks
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      className: theme === 'dark' ? 'dark-map-tiles' : '',
    });
    tiles.addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    routesLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer on Theme Change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      className: theme === 'dark' ? 'dark-map-tiles' : '',
    }).addTo(map);
  }, [theme]);

  // Render Vehicles and Active Trip Routes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !markersLayerRef.current || !routesLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    routesLayerRef.current.clearLayers();
    vehicleMarkersMap.current.clear();
    vehicleCoordsMap.current.clear();

    const bounds = L.latLngBounds();
    let hasCoords = false;

    // Filter vehicles according to selected tab
    const filteredVehicles = vehicles.filter((v) => {
      if (activeFilter === 'ON_TRIP') return v.status === 'On Trip';
      if (activeFilter === 'AVAILABLE') return v.status === 'Available';
      if (activeFilter === 'IN_SHOP') return v.status === 'In Shop';
      return true;
    });

    // 1. Draw Active Trip Route Lines
    const activeTrips = trips.filter((t) => t.status === 'Dispatched');
    activeTrips.forEach((trip) => {
      const srcCoords = getCityCoords(trip.source, 0);
      const destCoords = getCityCoords(trip.destination, 1);

      // Route line
      const polyline = L.polyline([srcCoords, destCoords], {
        color: '#38bdf8',
        weight: 3.5,
        opacity: 0.85,
        dashArray: '8, 8',
      });
      polyline.addTo(routesLayerRef.current);

      // Origin Pin (Green)
      const originIcon = L.divIcon({
        className: 'origin-marker',
        html: `
          <div class="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow ring-2 ring-white">
            A
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      L.marker(srcCoords, { icon: originIcon })
        .bindTooltip(`Origin: ${trip.source}`, { direction: 'top' })
        .addTo(routesLayerRef.current);

      // Destination Pin (Red)
      const destIcon = L.divIcon({
        className: 'dest-marker',
        html: `
          <div class="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow ring-2 ring-white">
            B
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      L.marker(destCoords, { icon: destIcon })
        .bindTooltip(`Destination: ${trip.destination}`, { direction: 'top' })
        .addTo(routesLayerRef.current);
    });

    // 2. Plot Vehicles
    filteredVehicles.forEach((vehicle, idx) => {
      const activeTrip = activeTrips.find(
        (t) => t.vehicle?._id === vehicle._id || t.vehicle === vehicle._id
      );

      const coords = getVehicleCoords(vehicle, activeTrip, idx);

      vehicleCoordsMap.current.set(vehicle._id, coords);
      bounds.extend(coords);
      hasCoords = true;

      // Color scheme and icons based on status
      let bgClass = 'bg-emerald-600';
      let pingClass = 'bg-emerald-400';
      let iconSymbol = '🚛';

      if (vehicle.status === 'On Trip') {
        bgClass = 'bg-blue-600';
        pingClass = 'bg-blue-400';
        iconSymbol = '🚚';
      } else if (vehicle.status === 'In Shop') {
        bgClass = 'bg-amber-600';
        pingClass = 'bg-amber-400';
        iconSymbol = '🔧';
      } else if (vehicle.status === 'Retired') {
        bgClass = 'bg-slate-600';
        pingClass = 'bg-slate-400';
        iconSymbol = '🛑';
      }

      const isSelected = selectedVehicleId === vehicle._id;

      const vehicleMarkerIcon = L.divIcon({
        className: 'custom-vehicle-marker',
        html: `
          <div class="group relative flex flex-col items-center justify-center cursor-pointer">
            ${vehicle.status === 'On Trip' ? `<span class="absolute inline-flex h-10 w-10 animate-ping rounded-full ${pingClass} opacity-60"></span>` : ''}
            <div class="relative flex h-8 w-8 items-center justify-center rounded-full ${bgClass} text-white shadow-xl ring-2 ${isSelected ? 'ring-signal-500 scale-125' : 'ring-white/90'} text-sm font-bold transition-transform transform hover:scale-125">
              ${iconSymbol}
            </div>
            <div class="mt-1 whitespace-nowrap rounded-md bg-slate-900/90 px-1.5 py-0.5 text-[10px] font-bold text-slate-100 shadow-md backdrop-blur">
              ${vehicle.registrationNumber}
            </div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker(coords, { icon: vehicleMarkerIcon });

      const popupContent = `
        <div style="font-family: system-ui, sans-serif; min-width: 210px; padding: 4px;">
          <div style="font-weight: 700; font-size: 14px; color: #0f172a; margin-bottom: 2px;">${vehicle.name}</div>
          <div style="font-family: monospace; font-size: 11px; font-weight: 600; color: #475569; margin-bottom: 8px;">${vehicle.registrationNumber}</div>
          
          <div style="display: flex; gap: 4px; margin-bottom: 8px;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; background-color: ${
              vehicle.status === 'On Trip'
                ? '#dbeafe; color: #1d4ed8'
                : vehicle.status === 'Available'
                ? '#dcfce7; color: #15803d'
                : '#fef3c7; color: #b45309'
            };">
              ● ${vehicle.status}
            </span>
            <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; background-color: #f1f5f9; color: #475569;">
              ${vehicle.type}
            </span>
          </div>

          <div style="font-size: 12px; color: #334155; border-top: 1px solid #e2e8f0; padding-top: 6px; line-height: 1.6;">
            <div><strong>Operational Region:</strong> ${vehicle.region || 'Unassigned'}</div>
            <div><strong>Max Capacity:</strong> ${vehicle.maxLoadCapacity} kg</div>
            <div><strong>Odometer:</strong> ${vehicle.odometer ? vehicle.odometer.toLocaleString() + ' km' : 'N/A'}</div>
            ${
              activeTrip
                ? `<div style="margin-top: 6px; padding: 4px 6px; background-color: #eff6ff; border-radius: 6px; color: #1d4ed8; font-weight: 600;">
                    Dispatched Route: ${activeTrip.source} ➔ ${activeTrip.destination}
                   </div>`
                : ''
            }
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.addTo(markersLayerRef.current);
      vehicleMarkersMap.current.set(vehicle._id, marker);
    });

    // Auto-fit bounds if markers exist
    if (hasCoords && bounds.isValid() && !selectedVehicleId) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
    }
  }, [vehicles, trips, activeFilter, selectedVehicleId]);

  const fitAll = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    setSelectedVehicleId(null);
    map.setView([22.9734, 78.6569], 5);
  };

  const focusVehicle = (vehicle) => {
    setSelectedVehicleId(vehicle._id);
    const map = mapInstanceRef.current;
    const coords = vehicleCoordsMap.current.get(vehicle._id);
    const marker = vehicleMarkersMap.current.get(vehicle._id);

    if (map && coords) {
      map.flyTo(coords, 10, { duration: 1.2 });
      if (marker) {
        setTimeout(() => {
          marker.openPopup();
        }, 600);
      }
    }
  };

  // Vehicles list for quick drawer
  const visibleVehicles = vehicles.filter((v) => {
    if (activeFilter === 'ON_TRIP') return v.status === 'On Trip';
    if (activeFilter === 'AVAILABLE') return v.status === 'Available';
    if (activeFilter === 'IN_SHOP') return v.status === 'In Shop';
    return true;
  });

  return (
    <div className="relative overflow-hidden rounded-3xl border border-base-700 bg-base-900 shadow-md">
      {/* Top Map Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-700/80 px-5 py-3.5 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-signal-500/10 text-signal-500">
            <Compass className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold text-base-100 flex items-center gap-2">
              <span>Live Fleet Radar &amp; GPS Tracking</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Live
              </span>
            </h3>
            <p className="mono text-[10px] text-base-400">
              Real-time asset telemetry • OpenStreetMap satellite radar
            </p>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setActiveFilter('ALL');
              setSelectedVehicleId(null);
            }}
            className={`rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
              activeFilter === 'ALL'
                ? 'bg-signal-500 text-white shadow-sm'
                : 'text-base-400 hover:bg-base-800 hover:text-base-200'
            }`}
          >
            All ({vehicles.length})
          </button>
          <button
            onClick={() => {
              setActiveFilter('ON_TRIP');
              setSelectedVehicleId(null);
            }}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
              activeFilter === 'ON_TRIP'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-base-400 hover:bg-base-800 hover:text-base-200'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400"></span>
            On Trip ({vehicles.filter((v) => v.status === 'On Trip').length})
          </button>
          <button
            onClick={() => {
              setActiveFilter('AVAILABLE');
              setSelectedVehicleId(null);
            }}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
              activeFilter === 'AVAILABLE'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-base-400 hover:bg-base-800 hover:text-base-200'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            Available ({vehicles.filter((v) => v.status === 'Available').length})
          </button>
          <button
            onClick={() => {
              setActiveFilter('IN_SHOP');
              setSelectedVehicleId(null);
            }}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-semibold transition ${
              activeFilter === 'IN_SHOP'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-base-400 hover:bg-base-800 hover:text-base-200'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
            In Shop ({vehicles.filter((v) => v.status === 'In Shop').length})
          </button>

          <button
            onClick={fitAll}
            title="Recenter Map (All India)"
            className="rounded-xl border border-base-700 bg-base-800 p-1.5 text-base-300 hover:bg-base-750 hover:text-base-100"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={mapContainerRef}
        style={{ height, width: '100%' }}
        className="z-0 bg-base-950"
      />

      {/* Quick Interactive Vehicle Selector Strip */}
      {visibleVehicles.length > 0 && (
        <div className="border-t border-base-700/80 bg-base-950/80 px-4 py-2.5 backdrop-blur">
          <p className="mb-2 mono text-[10px] uppercase tracking-wider text-base-400">
            Click any fleet asset to track &amp; inspect on radar:
          </p>
          <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
            {visibleVehicles.map((vehicle) => {
              const isSelected = selectedVehicleId === vehicle._id;
              return (
                <button
                  key={vehicle._id}
                  onClick={() => focusVehicle(vehicle)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-1.5 text-left text-xs transition ${
                    isSelected
                      ? 'border-signal-500 bg-signal-500/15 text-signal-400 ring-1 ring-signal-500 shadow-sm'
                      : 'border-base-700 bg-base-900/80 text-base-200 hover:border-base-600 hover:bg-base-800'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      vehicle.status === 'On Trip'
                        ? 'bg-blue-400 animate-pulse'
                        : vehicle.status === 'Available'
                        ? 'bg-emerald-400'
                        : 'bg-amber-400'
                    }`}
                  />
                  <div>
                    <span className="font-semibold">{vehicle.registrationNumber}</span>
                    <span className="ml-1 text-[10px] text-base-400">({vehicle.name})</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-700/80 bg-base-900/90 px-4 py-2 text-[11px] text-base-400 backdrop-blur">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-blue-500"></span> 🚚 On Active Trip
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span> 🚛 Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500"></span> 🔧 In Maintenance
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4 bg-sky-400 border-dashed"></span> Active Dispatch Route
          </span>
        </div>

        <span className="mono text-[10px] text-base-500">
          Showing {visibleVehicles.length} assets • Click marker or card for telemetry
        </span>
      </div>
    </div>
  );
}
