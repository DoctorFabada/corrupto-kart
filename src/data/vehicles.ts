export interface VehicleData {
  id: string;
  name: string;
  sprite: string; // filename in assets/vehiculos/ (without extension)
  color: string;
  stats: {
    speed: number;      // 1-10
    handling: number;   // 1-10
    resistance: number; // 1-10
  };
}

export const VEHICLES: VehicleData[] = [
  { id: 'rojo', name: 'Falcon de Cartón', sprite: 'rojo', color: '#ff3344', stats: { speed: 9, handling: 5, resistance: 3 } },
  { id: 'azul', name: 'Coche Oficial', sprite: 'azul', color: '#0066ff', stats: { speed: 6, handling: 7, resistance: 7 } },
  { id: 'negro', name: 'Celda Turbo', sprite: 'negro', color: '#333344', stats: { speed: 7, handling: 6, resistance: 6 } },
  { id: 'blanca', name: 'Puerta Giratoria', sprite: 'blanca', color: '#ddddee', stats: { speed: 5, handling: 9, resistance: 5 } },
  { id: 'naranja', name: 'Maletín con Ruedas', sprite: 'naranja', color: '#ff8800', stats: { speed: 10, handling: 4, resistance: 3 } },
  { id: 'verde', name: 'Router Rural', sprite: 'verde', color: '#00cc44', stats: { speed: 4, handling: 6, resistance: 10 } },
  { id: 'amarillo', name: 'Indulto Express', sprite: 'amarillo', color: '#ffcc00', stats: { speed: 8, handling: 7, resistance: 4 } },
  { id: 'poli', name: 'Patrulla Patriótica', sprite: 'poli', color: '#0044cc', stats: { speed: 7, handling: 8, resistance: 6 } },
];
