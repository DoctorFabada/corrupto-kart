// ─────────────────────────────────────────────────────────────
// CommentWall.ts — Muro de la Vergüenza (Supabase con fallback a localStorage)
// 1 comentario cada 24 horas, foro interactivo con búsqueda, filtros y paginación
// ─────────────────────────────────────────────────────────────

import { supabase } from '../utils/supabase';

interface Comment {
  name: string;
  message: string;
  timestamp: number;
}

const STORAGE_KEY = 'corruptokart_comments'; // Used for offline mode
const COOLDOWN_KEY = 'corruptokart_last_comment';
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

export class CommentWall {
  private overlay: HTMLElement;
  private nameInput: HTMLInputElement;
  private messageTextarea: HTMLTextAreaElement;
  private postBtn: HTMLButtonElement;
  private cooldownEl: HTMLElement;
  private listEl: HTMLElement;
  private backBtn: HTMLButtonElement;

  // New Forum Controls
  private searchInput: HTMLInputElement;
  private filterLatestBtn: HTMLButtonElement;
  private filterOldestBtn: HTMLButtonElement;
  private filterLongestBtn: HTMLButtonElement;
  private pagePrevBtn: HTMLButtonElement;
  private pageNextBtn: HTMLButtonElement;
  private pageIndicatorEl: HTMLElement;

  // State
  private allComments: Comment[] = [];
  private filteredComments: Comment[] = [];
  private currentSearch: string = '';
  private currentFilter: 'latest' | 'oldest' | 'longest' = 'latest';
  private currentPage: number = 1;
  private itemsPerPage: number = 6;

  private onBack: (() => void) | null = null;
  private cooldownInterval: number | null = null;
  private isOfflineMode: boolean = false;

  constructor() {
    this.overlay = document.getElementById('comment-wall')!;
    this.nameInput = document.getElementById('comment-name') as HTMLInputElement;
    this.messageTextarea = document.getElementById('comment-message') as HTMLTextAreaElement;
    this.postBtn = document.getElementById('btn-post-comment') as HTMLButtonElement;
    this.cooldownEl = document.getElementById('comment-cooldown')!;
    this.listEl = document.getElementById('comment-list')!;
    this.backBtn = document.getElementById('btn-comments-back') as HTMLButtonElement;

    // Get new interactive forum elements
    this.searchInput = document.getElementById('comment-search') as HTMLInputElement;
    this.filterLatestBtn = document.getElementById('btn-filter-latest') as HTMLButtonElement;
    this.filterOldestBtn = document.getElementById('btn-filter-oldest') as HTMLButtonElement;
    this.filterLongestBtn = document.getElementById('btn-filter-longest') as HTMLButtonElement;
    this.pagePrevBtn = document.getElementById('btn-page-prev') as HTMLButtonElement;
    this.pageNextBtn = document.getElementById('btn-page-next') as HTMLButtonElement;
    this.pageIndicatorEl = document.getElementById('comment-page-indicator')!;

    // Event listeners for publishing and going back
    this.postBtn.addEventListener('click', () => this.postComment());
    this.backBtn.addEventListener('click', () => {
      this.hide();
      if (this.onBack) this.onBack();
    });

    // Event listeners for interactive search and filters
    this.searchInput.addEventListener('input', () => {
      this.currentSearch = this.searchInput.value.toLowerCase().trim();
      this.currentPage = 1;
      this.applyFiltersAndPagination();
    });

    this.filterLatestBtn.addEventListener('click', () => this.setFilter('latest'));
    this.filterOldestBtn.addEventListener('click', () => this.setFilter('oldest'));
    this.filterLongestBtn.addEventListener('click', () => this.setFilter('longest'));

    // Pagination events
    this.pagePrevBtn.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderCurrentPage();
      }
    });

    this.pageNextBtn.addEventListener('click', () => {
      const maxPage = Math.ceil(this.filteredComments.length / this.itemsPerPage) || 1;
      if (this.currentPage < maxPage) {
        this.currentPage++;
        this.renderCurrentPage();
      }
    });
  }

  setOnBack(callback: () => void): void {
    this.onBack = callback;
  }

  show(): void {
    this.overlay.classList.add('active');
    this.currentPage = 1;
    this.loadComments();
    this.updateCooldown();
    // Start cooldown timer tick
    this.cooldownInterval = window.setInterval(() => this.updateCooldown(), 1000);
  }

  hide(): void {
    this.overlay.classList.remove('active');
    if (this.cooldownInterval !== null) {
      clearInterval(this.cooldownInterval);
      this.cooldownInterval = null;
    }
  }

  // ── Database & Loading ──────────────────────────────────────

  private async loadComments(): Promise<void> {
    this.showLoading();

    if (!supabase) {
      // Graceful fallback to localStorage
      this.isOfflineMode = true;
      this.loadLocalComments();
      return;
    }

    try {
      // Query the latest 150 comments to do high-performance local filtering and instant pagination
      const { data, error } = await supabase
        .from('comments')
        .select('name, message, timestamp')
        .order('timestamp', { ascending: false })
        .limit(150);

      if (error) throw error;

      this.allComments = data || [];
      this.isOfflineMode = false;
      this.applyFiltersAndPagination();
    } catch (e) {
      console.warn('Failed to load from Supabase, falling back to localStorage:', e);
      this.isOfflineMode = true;
      this.loadLocalComments();
    }
  }

  private loadLocalComments(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.allComments = raw ? JSON.parse(raw) as Comment[] : [];
    } catch {
      this.allComments = [];
    }
    this.applyFiltersAndPagination();
  }

  private showLoading(): void {
    this.listEl.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; gap: 12px; color: var(--neon-cyan); font-family: var(--font-hud); text-align: center;">
        <span style="font-size: 24px; animation: pulse 1s infinite;">⏳</span>
        <span>ACCEDIENDO A LOS EXPEDIENTES DE LA FISCALÍA...</span>
      </div>
    `;
  }

  // ── Filters, Search & Pagination Logic ──────────────────────

  private setFilter(filter: 'latest' | 'oldest' | 'longest'): void {
    this.filterLatestBtn.classList.toggle('active', filter === 'latest');
    this.filterOldestBtn.classList.toggle('active', filter === 'oldest');
    this.filterLongestBtn.classList.toggle('active', filter === 'longest');

    this.currentFilter = filter;
    this.currentPage = 1;
    this.applyFiltersAndPagination();
  }

  private applyFiltersAndPagination(): void {
    // 1. Apply Search
    if (this.currentSearch) {
      this.filteredComments = this.allComments.filter(comment => 
        comment.name.toLowerCase().includes(this.currentSearch) ||
        comment.message.toLowerCase().includes(this.currentSearch)
      );
    } else {
      this.filteredComments = [...this.allComments];
    }

    // 2. Apply Filters/Sorting
    if (this.currentFilter === 'latest') {
      this.filteredComments.sort((a, b) => b.timestamp - a.timestamp);
    } else if (this.currentFilter === 'oldest') {
      this.filteredComments.sort((a, b) => a.timestamp - b.timestamp);
    } else if (this.currentFilter === 'longest') {
      this.filteredComments.sort((a, b) => b.message.length - a.message.length);
    }

    this.renderCurrentPage();
  }

  private renderCurrentPage(): void {
    this.listEl.innerHTML = '';

    const total = this.filteredComments.length;
    const maxPage = Math.ceil(total / this.itemsPerPage) || 1;

    // Guard against current page going out of bounds
    if (this.currentPage > maxPage) {
      this.currentPage = maxPage;
    }

    // Update Pagination UI
    this.pageIndicatorEl.textContent = `PÁGINA ${this.currentPage} DE ${maxPage}`;
    this.pagePrevBtn.disabled = this.currentPage === 1;
    this.pageNextBtn.disabled = this.currentPage === maxPage;

    if (total === 0) {
      const empty = document.createElement('p');
      empty.style.color = 'var(--text-secondary)';
      empty.style.fontFamily = 'var(--font-hud)';
      empty.style.fontSize = '13px';
      empty.style.textAlign = 'center';
      empty.style.padding = '30px';
      empty.textContent = this.currentSearch 
        ? 'No se encontraron testimonios que coincidan con la búsqueda...' 
        : 'Nadie ha declarado todavía... ¿Serás el primer presunto?';
      this.listEl.appendChild(empty);
      return;
    }

    // Slice comments for current page
    const startIdx = (this.currentPage - 1) * this.itemsPerPage;
    const pageComments = this.filteredComments.slice(startIdx, startIdx + this.itemsPerPage);

    for (const comment of pageComments) {
      const card = document.createElement('div');
      card.className = 'comment-card';

      const header = document.createElement('div');
      header.className = 'comment-card-header';

      const nameEl = document.createElement('span');
      nameEl.className = 'comment-card-name';
      nameEl.textContent = `💼 ${comment.name}`;

      const timeEl = document.createElement('span');
      timeEl.className = 'comment-card-time';
      timeEl.textContent = this.formatRelativeTime(comment.timestamp);

      header.appendChild(nameEl);
      header.appendChild(timeEl);

      const textEl = document.createElement('p');
      textEl.className = 'comment-card-text';
      textEl.textContent = comment.message;

      card.appendChild(header);
      card.appendChild(textEl);
      this.listEl.appendChild(card);
    }
  }

  // ── Cooldown & Posting ──────────────────────────────────────

  private updateCooldown(): void {
    const total = this.allComments.length;
    this.postBtn.disabled = false;
    this.cooldownEl.style.color = 'var(--neon-cyan)';
    this.cooldownEl.textContent = `🟢 SISTEMA ABIERTO · ${total} ACTAS REGISTRADAS`;
  }

  private async postComment(): Promise<void> {
    const name = this.nameInput.value.trim() || 'Anónimo Impune';
    const message = this.messageTextarea.value.trim();

    if (!message) return;
    if (message.length > 500) return;

    const comment: Comment = {
      name,
      message,
      timestamp: Date.now(),
    };

    this.postBtn.disabled = true;
    this.postBtn.textContent = 'REGISTRANDO...';

    let success = false;

    if (supabase && !this.isOfflineMode) {
      try {
        const { error } = await supabase
          .from('comments')
          .insert([comment]);

        if (error) throw error;
        success = true;
      } catch (e) {
        console.error('Failed to post to Supabase, saving locally:', e);
        success = this.saveLocalComment(comment);
      }
    } else {
      success = this.saveLocalComment(comment);
    }

    if (success) {
      // Reset form
      this.nameInput.value = '';
      this.messageTextarea.value = '';

      // Reload list and scroll to top
      this.currentPage = 1;
      await this.loadComments();
    } else {
      alert('Error al registrar la coartada en el acta. Inténtalo de nuevo.');
    }

    this.postBtn.textContent = '📝 REGISTRAR EN ACTA';
    this.updateCooldown();
  }

  private saveLocalComment(comment: Comment): boolean {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const comments = raw ? JSON.parse(raw) as Comment[] : [];
      comments.unshift(comment);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(comments.slice(0, 150)));
      return true;
    } catch {
      return false;
    }
  }

  // ── Helpers ──────────────────────────────────────────────────

  private formatRelativeTime(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'ahora mismo';
    if (minutes < 60) return `hace ${minutes}m`;
    if (hours < 24) return `hace ${hours}h`;
    if (days === 1) return 'ayer';
    return `hace ${days} días`;
  }
}
