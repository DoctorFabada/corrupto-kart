import { GameAssets } from '../game/AssetLoader';
import { CHARACTERS, CharacterData } from '../data/characters';
import { VEHICLES, VehicleData } from '../data/vehicles';

export interface SelectionResult {
  character: CharacterData;
  vehicle: VehicleData;
  vehicleSprite: HTMLImageElement;
  characterSprite: HTMLImageElement;
}

export class SelectionScreen {
  private container: HTMLElement;
  private characterGrid: HTMLElement;
  private vehicleGrid: HTMLElement;

  private selectedCharacterId: string = CHARACTERS[0].id;
  private selectedVehicleId: string = VEHICLES[0].id;

  private assets: GameAssets;
  private onConfirmCb: ((result: SelectionResult) => void) | null = null;
  private onBackCb: (() => void) | null = null;

  constructor(assets: GameAssets) {
    this.assets = assets;
    this.container = document.getElementById('selection-screen')!;
    this.characterGrid = document.getElementById('character-grid')!;
    this.vehicleGrid = document.getElementById('vehicle-grid')!;

    this.buildCharacterCards();
    this.buildVehicleCards();
    this.updateSelection();

    document.getElementById('btn-race')!.addEventListener('click', () => this.confirm());
    document.getElementById('btn-back')!.addEventListener('click', () => {
      if (this.onBackCb) this.onBackCb();
    });
  }

  // --- Build DOM cards ---

  private buildCharacterCards(): void {
    this.characterGrid.innerHTML = '';
    for (const char of CHARACTERS) {
      const card = document.createElement('div');
      card.className = 'selection-card character-card';
      card.dataset.id = char.id;

      const charImg = this.assets.characters.get(char.id);
      card.innerHTML = `
        <div class="card-img-wrapper char-img-wrapper">
          <img src="${charImg?.src || ''}" alt="${char.name}" draggable="false" />
        </div>
        <span class="card-name">${char.name}</span>
      `;

      card.addEventListener('click', () => {
        this.selectedCharacterId = char.id;
        this.updateSelection();
      });

      this.characterGrid.appendChild(card);
    }
  }

  private buildVehicleCards(): void {
    this.vehicleGrid.innerHTML = '';
    for (const veh of VEHICLES) {
      const card = document.createElement('div');
      card.className = 'selection-card vehicle-card';
      card.dataset.id = veh.id;

      const vehImg = this.assets.vehicles.get(veh.id);
      card.innerHTML = `
        <div class="card-img-wrapper veh-img-wrapper">
          <img src="${vehImg?.src || ''}" alt="${veh.name}" draggable="false" />
        </div>
        <span class="card-name">${veh.name}</span>
        <div class="card-stats">
          <div class="stat-row">
            <span class="stat-label">VEL</span>
            <div class="stat-track"><div class="stat-fill" style="width:${veh.stats.speed * 10}%;background:var(--neon-red)"></div></div>
          </div>
          <div class="stat-row">
            <span class="stat-label">MAN</span>
            <div class="stat-track"><div class="stat-fill" style="width:${veh.stats.handling * 10}%;background:var(--neon-blue)"></div></div>
          </div>
          <div class="stat-row">
            <span class="stat-label">RES</span>
            <div class="stat-track"><div class="stat-fill" style="width:${veh.stats.resistance * 10}%;background:var(--neon-green)"></div></div>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        this.selectedVehicleId = veh.id;
        this.updateSelection();
      });

      this.vehicleGrid.appendChild(card);
    }
  }

  // --- Selection state ---

  private updateSelection(): void {
    // Highlight selected character card
    this.characterGrid.querySelectorAll('.character-card').forEach(card => {
      const el = card as HTMLElement;
      el.classList.toggle('selected', el.dataset.id === this.selectedCharacterId);
    });

    // Highlight selected vehicle card
    this.vehicleGrid.querySelectorAll('.vehicle-card').forEach(card => {
      const el = card as HTMLElement;
      el.classList.toggle('selected', el.dataset.id === this.selectedVehicleId);
    });

    // Update preview
    const char = CHARACTERS.find(c => c.id === this.selectedCharacterId)!;
    const veh = VEHICLES.find(v => v.id === this.selectedVehicleId)!;

    const previewCharImg = document.getElementById('preview-character-img') as HTMLImageElement;
    const previewVehImg = document.getElementById('preview-vehicle-img') as HTMLImageElement;
    const previewName = document.getElementById('preview-name');
    const previewQuote = document.getElementById('preview-quote');

    const charSprite = this.assets.characters.get(this.selectedCharacterId);
    const vehSprite = this.assets.vehicles.get(this.selectedVehicleId);

    if (previewCharImg && charSprite) previewCharImg.src = charSprite.src;
    if (previewVehImg && vehSprite) previewVehImg.src = vehSprite.src;
    if (previewName) previewName.textContent = `${char.name} × ${veh.name}`;
    if (previewQuote) previewQuote.textContent = `"${char.catchphrase}"`;
  }

  // --- Callbacks ---

  private confirm(): void {
    const char = CHARACTERS.find(c => c.id === this.selectedCharacterId)!;
    const veh = VEHICLES.find(v => v.id === this.selectedVehicleId)!;

    if (this.onConfirmCb) {
      this.onConfirmCb({
        character: char,
        vehicle: veh,
        vehicleSprite: this.assets.vehicles.get(veh.id)!,
        characterSprite: this.assets.characters.get(char.id)!,
      });
    }
  }

  setOnConfirm(cb: (result: SelectionResult) => void): void {
    this.onConfirmCb = cb;
  }

  setOnBack(cb: () => void): void {
    this.onBackCb = cb;
  }

  show(): void {
    this.container.classList.add('active');
  }

  hide(): void {
    this.container.classList.remove('active');
  }
}
