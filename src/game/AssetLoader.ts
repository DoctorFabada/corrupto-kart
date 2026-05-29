export interface GameAssets {
  vehicles: Map<string, HTMLImageElement>;
  characters: Map<string, HTMLImageElement>;
  menuMusic: HTMLAudioElement;
  raceMusic: HTMLAudioElement;
  victoryMusic: HTMLAudioElement;
}

export class AssetLoader {
  private loaded = false;
  private assets: GameAssets | null = null;

  async loadAll(): Promise<GameAssets> {
    if (this.loaded && this.assets) return this.assets;

    const vehicleNames = ['rojo', 'azul', 'blanca', 'naranja', 'negro', 'poli', 'verde', 'amarillo'];
    const characterFiles: Array<{ file: string; id: string }> = [
      { file: 'sanchez.png', id: 'sanchez' },
      { file: 'mariano.png', id: 'mariano' },
      { file: 'abascal.png', id: 'abascal' },
      { file: 'montero.png', id: 'montero' },
      { file: 'zapatero.png', id: 'zapatero' },
    ];

    // Load vehicles
    const vehicles = new Map<string, HTMLImageElement>();
    const vehiclePromises = vehicleNames.map(name => {
      return this.loadImage(`/assets/vehiculos/${name}.png`).then(img => {
        vehicles.set(name, img);
      });
    });

    // Load characters  
    const characters = new Map<string, HTMLImageElement>();
    const charPromises = characterFiles.map(({ file, id }) => {
      return this.loadImage(`/assets/personajes/${file}`).then(img => {
        characters.set(id, img);
      });
    });

    // Load audio
    const menuMusic = new Audio('/assets/cancion/menu.mp3');
    menuMusic.loop = true;
    menuMusic.volume = 0.5;
    const raceMusic = new Audio('/assets/cancion/cancion.mp3');
    raceMusic.loop = true;
    raceMusic.volume = 0.4;
    const victoryMusic = new Audio('/assets/cancion/victoria.mp3');
    victoryMusic.loop = true;
    victoryMusic.volume = 0.5;

    await Promise.all([...vehiclePromises, ...charPromises]);

    this.assets = { vehicles, characters, menuMusic, raceMusic, victoryMusic };
    this.loaded = true;
    return this.assets;
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn(`Failed to load image: ${src}, using placeholder`);
        // Create placeholder
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(0, 0, 64, 64);
        ctx.fillStyle = '#000';
        ctx.font = '10px monospace';
        ctx.fillText('?', 28, 36);
        const placeholder = new Image();
        placeholder.src = canvas.toDataURL();
        placeholder.onload = () => resolve(placeholder);
      };
      img.src = src;
    });
  }
}
