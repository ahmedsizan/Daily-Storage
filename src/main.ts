import './style.css';
import type { Note } from './types.ts';
import { getCurrentUser, signIn, signUp, signOut, onAuthStateChange, getUserDisplayName } from './auth.ts';
import { fetchNotes, createNote, updateNote, deleteNote, togglePinNote } from './notes.ts';
import {
  renderAuthView,
  renderDashboardView,
  renderNoteModal,
  showToast
} from './ui.ts';

class DailyStorageApp {
  private appRoot: HTMLElement;
  private currentUser: any | null = null;
  private notes: Note[] = [];
  private searchQuery: string = '';
  private isSignUpMode: boolean = false;
  private isSubmitting: boolean = false;
  private activeModal: HTMLElement | null = null;
  private searchDebounceTimer: any = null;

  constructor(rootId: string) {
    const root = document.getElementById(rootId);
    if (!root) throw new Error(`Root element #${rootId} not found`);
    this.appRoot = root;
  }

  public async init() {
    // Show initial loading skeleton or spinner
    this.appRoot.innerHTML = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; gap: 12px; color: #94a3b8;">
        <div class="spinner"></div>
        <span>Connecting to Daily Storage...</span>
      </div>
    `;

    // Listen to Supabase auth state changes
    onAuthStateChange((user) => {
      this.currentUser = user;
      this.render();
    });

    try {
      this.currentUser = await getCurrentUser();
    } catch (err: any) {
      console.warn('Could not fetch active user session:', err);
      this.currentUser = null;
    }

    await this.render();
  }

  private async render() {
    if (!this.currentUser) {
      this.renderAuth();
    } else {
      await this.loadNotesAndRenderDashboard();
    }
  }

  // ----------------------------------------------------
  // Auth View & Handlers
  // ----------------------------------------------------
  private renderAuth() {
    renderAuthView(this.appRoot, this.isSignUpMode);

    const form = document.getElementById('auth-form') as HTMLFormElement | null;
    const tabLogin = document.getElementById('tab-login');
    const tabSignUp = document.getElementById('tab-signup');

    tabLogin?.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.isSignUpMode) {
        this.isSignUpMode = false;
        this.renderAuth();
      }
    });

    tabSignUp?.addEventListener('click', (e) => {
      e.preventDefault();
      if (!this.isSignUpMode) {
        this.isSignUpMode = true;
        this.renderAuth();
      }
    });

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (this.isSubmitting) return;

      const usernameInput = document.getElementById('auth-username') as HTMLInputElement;
      const passwordInput = document.getElementById('auth-password') as HTMLInputElement;
      const submitBtn = document.getElementById('auth-submit-btn') as HTMLButtonElement;

      const username = usernameInput.value.trim();
      const password = passwordInput.value;

      if (!username || !password) {
        showToast('Please fill in your name and password', 'error');
        return;
      }

      if (username.length < 3) {
        showToast('Name/Username must be at least 3 characters long', 'error');
        return;
      }

      try {
        this.isSubmitting = true;
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `<span class="spinner"></span> <span>Please wait...</span>`;
        }

        if (this.isSignUpMode) {
          const data = await signUp(username, password);
          
          // Check if Supabase returned existing user with empty identities (username already taken)
          if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
            showToast('This username is already taken! Please choose another one or sign in.', 'error');
            return;
          }

          if (data.session) {
            showToast(`Welcome, ${username}! Your storage is ready.`, 'success');
            this.currentUser = data.user;
            await this.render();
          } else {
            // If session not directly returned, auto sign-in immediately
            try {
              const loginData = await signIn(username, password);
              showToast(`Welcome, ${username}!`, 'success');
              this.currentUser = loginData.user;
              await this.render();
            } catch {
              showToast('Account created! Please sign in with your name and password.', 'success');
              this.isSignUpMode = false;
              this.renderAuth();
            }
          }
        } else {
          const data = await signIn(username, password);
          showToast('Signed in successfully!', 'success');
          this.currentUser = data.user;
          await this.render();
        }
      } catch (err: any) {
        const msg = err.message || '';
        if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
          showToast('This name/username is already taken! Please sign in or pick another name.', 'error');
        } else if (msg.toLowerCase().includes('invalid login credentials')) {
          showToast('Incorrect name or password. Please check and try again.', 'error');
        } else if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('rate_limit')) {
          showToast('Supabase Email Confirm is ON! Please turn OFF "Confirm email" in Supabase Dashboard.', 'error');
        } else {
          showToast(msg || 'Authentication failed', 'error');
        }
      } finally {
        this.isSubmitting = false;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>${this.isSignUpMode ? 'Create Account & Open Storage' : 'Sign In to Daily Storage'}</span>`;
        }
      }
    });
  }

  // ----------------------------------------------------
  // Dashboard & Notes
  // ----------------------------------------------------
  private async loadNotesAndRenderDashboard() {
    try {
      this.notes = await fetchNotes(this.searchQuery);
    } catch (err: any) {
      showToast(err.message || 'Failed to load notes', 'error');
      this.notes = [];
    }

    const displayName = getUserDisplayName(this.currentUser);
    renderDashboardView(this.appRoot, displayName, this.notes, this.searchQuery);
    this.bindDashboardEvents();
  }

  private bindDashboardEvents() {
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    logoutBtn?.addEventListener('click', async () => {
      try {
        await signOut();
        this.currentUser = null;
        this.notes = [];
        this.searchQuery = '';
        showToast('Logged out safely', 'info');
        this.renderAuth();
      } catch (err: any) {
        showToast(err.message || 'Error signing out', 'error');
      }
    });

    // New Note Buttons
    const newNoteBtn = document.getElementById('btn-new-note');
    newNoteBtn?.addEventListener('click', () => this.openNoteModal());

    const emptyNewNoteBtn = document.getElementById('btn-empty-new-note');
    emptyNewNoteBtn?.addEventListener('click', () => this.openNoteModal());

    // Search Input with Debounce
    const searchInput = document.getElementById('search-input') as HTMLInputElement | null;
    searchInput?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = setTimeout(async () => {
        this.searchQuery = target.value;
        await this.loadNotesAndRenderDashboard();
        // Restore focus to search input after re-render
        const reSearchInput = document.getElementById('search-input') as HTMLInputElement | null;
        if (reSearchInput) {
          reSearchInput.focus();
          reSearchInput.setSelectionRange(reSearchInput.value.length, reSearchInput.value.length);
        }
      }, 250);
    });

    // Notes Grid Delegation (Pin, Edit, Delete)
    const dashboardContent = document.querySelector('.dashboard-content');
    dashboardContent?.addEventListener('click', async (e) => {
      const target = (e.target as HTMLElement).closest('button');
      if (!target) return;

      const action = target.getAttribute('data-action');
      const noteId = target.getAttribute('data-id');
      if (!action || !noteId) return;

      if (action === 'toggle-pin') {
        const isPinned = target.getAttribute('data-pinned') === 'true';
        try {
          await togglePinNote(noteId, isPinned);
          await this.loadNotesAndRenderDashboard();
          showToast(isPinned ? 'Note unpinned' : 'Note pinned to top', 'info');
        } catch (err: any) {
          showToast(err.message || 'Failed to toggle pin', 'error');
        }
      } else if (action === 'edit') {
        const note = this.notes.find((n) => n.id === noteId);
        if (note) {
          this.openNoteModal(note);
        }
      } else if (action === 'delete') {
        if (confirm('Are you sure you want to delete this note?')) {
          try {
            await deleteNote(noteId);
            showToast('Note deleted successfully', 'success');
            await this.loadNotesAndRenderDashboard();
          } catch (err: any) {
            showToast(err.message || 'Failed to delete note', 'error');
          }
        }
      }
    });

    // Shortcut: Ctrl+N or Cmd+N to open new note
    window.onkeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        this.openNoteModal();
      }
    };
  }

  // ----------------------------------------------------
  // Note Modal (Create & Edit)
  // ----------------------------------------------------
  private openNoteModal(existingNote?: Note) {
    if (this.activeModal) {
      this.closeNoteModal();
    }

    const modal = renderNoteModal(existingNote);
    document.body.appendChild(modal);
    this.activeModal = modal;

    const form = modal.querySelector('#note-modal-form') as HTMLFormElement;
    const closeBtn = modal.querySelector('#modal-close-btn');
    const cancelBtn = modal.querySelector('#modal-cancel-btn');
    const titleInput = modal.querySelector('#modal-note-title') as HTMLInputElement;
    const contentInput = modal.querySelector('#modal-note-content') as HTMLTextAreaElement;
    const pinCheckbox = modal.querySelector('#modal-note-pin') as HTMLInputElement;

    const closeModal = () => this.closeNoteModal();

    closeBtn?.addEventListener('click', closeModal);
    cancelBtn?.addEventListener('click', closeModal);

    // Click outside to dismiss
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Escape key to dismiss and Ctrl+Enter to submit
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        form?.dispatchEvent(new Event('submit'));
      }
    };
    this.modalKeyDownHandler = handleKeyDown;
    window.addEventListener('keydown', handleKeyDown);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = titleInput.value.trim();
      const content = contentInput.value;
      const is_pinned = pinCheckbox.checked;

      if (!title) {
        showToast('Please provide a title for your note', 'error');
        return;
      }

      const saveBtn = modal.querySelector('#modal-save-btn') as HTMLButtonElement;
      saveBtn.disabled = true;
      saveBtn.innerHTML = `<span class="spinner"></span> <span>Saving...</span>`;

      try {
        if (existingNote) {
          await updateNote(existingNote.id, { title, content, is_pinned });
          showToast('Note updated successfully', 'success');
        } else {
          await createNote({ title, content, is_pinned });
          showToast('New note stored safely', 'success');
        }

        closeModal();
        await this.loadNotesAndRenderDashboard();
      } catch (err: any) {
        showToast(err.message || 'Failed to save note', 'error');
        saveBtn.disabled = false;
        saveBtn.innerHTML = `<span>${existingNote ? 'Save Changes' : 'Create Note'}</span>`;
      }
    });
  }

  private modalKeyDownHandler: ((e: KeyboardEvent) => void) | null = null;

  private closeNoteModal() {
    if (this.modalKeyDownHandler) {
      window.removeEventListener('keydown', this.modalKeyDownHandler);
      this.modalKeyDownHandler = null;
    }
    if (this.activeModal) {
      this.activeModal.remove();
      this.activeModal = null;
    }
  }
}

// Bootstrap application
document.addEventListener('DOMContentLoaded', () => {
  const app = new DailyStorageApp('app');
  app.init();
});
