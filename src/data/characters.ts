export interface CharacterData {
  id: string;
  name: string;
  subtitle: string;
  sprite: string; // filename in assets/personajes/ (without extension)
  color: string;  // Neon accent color for this character
  stats: {
    charisma: number;   // 1-10 — Affects boost frequency
    corruption: number; // 1-10 — Affects item power
    evasion: number;    // 1-10 — Affects dodge ability
  };
  catchphrase: string;
  victoryQuote: string;
}

export const CHARACTERS: CharacterData[] = [
  {
    id: 'sanchez',
    name: 'El Bello Durmiente',
    subtitle: 'Pedro Sánchez',
    sprite: 'sanchez',
    color: '#ff3344',
    stats: { charisma: 9, corruption: 7, evasion: 10 },
    catchphrase: '¡No es no! ...bueno, vale, sí.',
    victoryQuote: '¡He resistido y he ganado! Como siempre.',
  },
  {
    id: 'mariano',
    name: 'El Registrador',
    subtitle: 'Mariano Rajoy',
    sprite: 'mariano',
    color: '#0066ff',
    stats: { charisma: 6, corruption: 8, evasion: 7 },
    catchphrase: 'Es el vecino el que elige al alcalde...',
    victoryQuote: 'Somos sentimientos y tenemos seres humanos.',
  },
  {
    id: 'abascal',
    name: 'El Patriota',
    subtitle: 'Santiago Abascal',
    sprite: 'abascal',
    color: '#00cc44',
    stats: { charisma: 7, corruption: 5, evasion: 4 },
    catchphrase: '¡España lo primero! Y mi caballo también.',
    victoryQuote: '¡Victoria para la reconquista del asfalto!',
  },
  {
    id: 'montero',
    name: 'La Ministra',
    subtitle: 'Irene Montero',
    sprite: 'montero',
    color: '#9b59b6',
    stats: { charisma: 8, corruption: 4, evasion: 6 },
    catchphrase: 'Solo sí es sí... al acelerador.',
    victoryQuote: '¡Primera en cruzar el techo de cristal de la meta!',
  },
  {
    id: 'zapatero',
    name: 'El Negociador',
    subtitle: 'José Luis R. Zapatero',
    sprite: 'zapatero',
    color: '#ff8800',
    stats: { charisma: 7, corruption: 6, evasion: 8 },
    catchphrase: 'Yo de eso no tengo constancia...',
    victoryQuote: '¡El plan de la alianza de civilizaciones funciona!',
  },
];
