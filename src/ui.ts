import type { Note, ToastType } from './types.ts';

// Inline SVGs for crisp, dependency-free icons
export const ICONS = {
  logo: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10"/><path d="M6 10h10"/><path d="M6 14h6"/></svg>`,
  user: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  mail: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  lock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  search: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  plus: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,
  pin: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>`,
  pinFilled: `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/><line x1="12" y1="17" x2="12" y2="22" stroke="currentColor" stroke-width="2"/></svg>`,
  edit: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`,
  trash: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`,
  logout: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  check: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  alert: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
};

export function showToast(message: string, type: ToastType = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? ICONS.check : ICONS.alert}</span>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    setTimeout(() => toast.remove(), 200);
  }, 3500);
}

export function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  } catch {
    return dateString;
  }
}

export function renderAuthView(container: HTMLElement, isSignUp: boolean) {
  container.innerHTML = `
    <div class="auth-wrapper">
      <div class="auth-card">
        <div class="auth-header">
          <div class="auth-logo">
            ${ICONS.logo}
          </div>
          <h1><span class="gradient-text">Daily Storage</span></h1>
          <p>${isSignUp ? 'Choose your name and set a password' : 'Enter your name and password to access your notes'}</p>
        </div>

        <div class="auth-tabs">
          <button id="tab-login" class="auth-tab-btn ${!isSignUp ? 'active' : ''}">Sign In</button>
          <button id="tab-signup" class="auth-tab-btn ${isSignUp ? 'active' : ''}">Create Account</button>
        </div>

        <form id="auth-form" class="auth-form">
          <div class="form-group">
            <label for="auth-username">Your Name / Username</label>
            <div class="input-icon-wrap">
              ${ICONS.user}
              <input 
                type="text" 
                id="auth-username" 
                placeholder="e.g. ahmed or john_doe" 
                required 
                minlength="3" 
                maxlength="30"
                autocomplete="username" 
                autofocus
              />
            </div>
          </div>

          <div class="form-group">
            <label for="auth-password">Password</label>
            <div class="input-icon-wrap">
              ${ICONS.lock}
              <input 
                type="password" 
                id="auth-password" 
                placeholder="••••••••" 
                required 
                minlength="6" 
                autocomplete="${isSignUp ? 'new-password' : 'current-password'}" 
              />
            </div>
          </div>

          <button type="submit" id="auth-submit-btn" class="btn-primary">
            <span>${isSignUp ? 'Create Account & Open Storage' : 'Sign In to Daily Storage'}</span>
          </button>
        </form>
      </div>
    </div>
  `;
}

export function renderDashboardView(
  container: HTMLElement,
  userName: string,
  notes: Note[],
  searchQuery: string = ''
) {
  const pinnedNotes = notes.filter((n) => n.is_pinned);
  const otherNotes = notes.filter((n) => !n.is_pinned);
  const initial = userName ? userName.charAt(0).toUpperCase() : 'U';

  container.innerHTML = `
    <div class="dashboard-wrapper">
      <!-- Top Sticky Navigation -->
      <header class="app-navbar">
        <div class="nav-left">
          <div class="brand-icon">
            ${ICONS.logo}
          </div>
          <span class="brand-title"><span class="gradient-text">Daily Storage</span></span>
        </div>

        <div class="nav-center">
          <div class="search-input-wrap">
            ${ICONS.search}
            <input 
              type="text" 
              id="search-input" 
              placeholder="Search in your notes..." 
              value="${escapeHtml(searchQuery)}" 
            />
          </div>
        </div>

        <div class="nav-right">
          <div class="user-badge" title="Logged in as ${escapeHtml(userName)}">
            <span class="avatar-circle">${initial}</span>
            <span>${escapeHtml(userName)}</span>
          </div>
          <button id="logout-btn" class="btn-icon-outline" title="Sign Out">
            ${ICONS.logout}
            <span>Logout</span>
          </button>
        </div>
      </header>

      <!-- Main Content -->
      <main class="dashboard-content">
        <div class="dashboard-hero">
          <div class="hero-stats">
            <div class="stat-pill">Total Notes: <strong>${notes.length}</strong></div>
            ${pinnedNotes.length > 0 ? `<div class="stat-pill">Pinned: <strong>${pinnedNotes.length}</strong></div>` : ''}
          </div>
          <button id="btn-new-note" class="btn-new-note">
            ${ICONS.plus}
            <span>+ New Note</span>
          </button>
        </div>

        ${notes.length === 0 ? renderEmptyState(searchQuery) : ''}

        ${
          pinnedNotes.length > 0
            ? `
          <div class="section-title">
            ${ICONS.pinFilled}
            <span>Pinned Notes (${pinnedNotes.length})</span>
          </div>
          <div class="notes-grid">
            ${pinnedNotes.map((n) => renderNoteCard(n)).join('')}
          </div>
        `
            : ''
        }

        ${
          otherNotes.length > 0
            ? `
          ${pinnedNotes.length > 0 ? `<div class="section-title"><span>Other Notes (${otherNotes.length})</span></div>` : ''}
          <div class="notes-grid">
            ${otherNotes.map((n) => renderNoteCard(n)).join('')}
          </div>
        `
            : ''
        }
      </main>
    </div>
  `;
}

function renderNoteCard(note: Note): string {
  return `
    <article class="note-card ${note.is_pinned ? 'is-pinned' : ''}" data-note-id="${note.id}">
      <div>
        <div class="note-card-header">
          <h3 class="note-title">${escapeHtml(note.title)}</h3>
          <button 
            class="pin-toggle-btn ${note.is_pinned ? 'pinned' : ''}" 
            data-action="toggle-pin" 
            data-id="${note.id}" 
            data-pinned="${note.is_pinned}"
            title="${note.is_pinned ? 'Unpin note' : 'Pin note'}"
          >
            ${note.is_pinned ? ICONS.pinFilled : ICONS.pin}
          </button>
        </div>
        <p class="note-body">${escapeHtml(note.content || '(No content)')}</p>
      </div>

      <div class="note-footer">
        <span class="note-time">${formatDate(note.updated_at)}</span>
        <div class="note-actions">
          <button class="action-btn edit-btn" data-action="edit" data-id="${note.id}" title="Edit note">
            ${ICONS.edit}
            <span>Edit</span>
          </button>
          <button class="action-btn delete-btn" data-action="delete" data-id="${note.id}" title="Delete note">
            ${ICONS.trash}
            <span>Delete</span>
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderEmptyState(searchQuery: string): string {
  if (searchQuery) {
    return `
      <div class="empty-state">
        <div class="empty-icon">${ICONS.search}</div>
        <h3>No matching notes found</h3>
        <p>Try searching for something else or clear the search field to see all your notes.</p>
      </div>
    `;
  }
  return `
    <div class="empty-state">
      <div class="empty-icon">${ICONS.logo}</div>
      <h3>Your Daily Storage is empty</h3>
      <p>Store your daily thoughts, reminders, codes, or private notes securely online.</p>
      <button id="btn-empty-new-note" class="btn-primary">
        ${ICONS.plus}
        <span>Create Your First Note</span>
      </button>
    </div>
  `;
}

export function renderNoteModal(note?: Note): HTMLElement {
  const isEditing = !!note;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'note-modal-overlay';

  overlay.innerHTML = `
    <div class="modal-container">
      <div class="modal-header">
        <h3>${isEditing ? 'Edit Note' : 'Create New Note'}</h3>
        <button id="modal-close-btn" class="btn-close" aria-label="Close modal">✕</button>
      </div>
      <form id="note-modal-form">
        <div class="modal-body">
          <input 
            type="text" 
            id="modal-note-title" 
            class="input-title" 
            placeholder="Note Title..." 
            value="${escapeHtml(note?.title || '')}" 
            required 
            maxlength="200"
            autofocus 
          />
          <textarea 
            id="modal-note-content" 
            class="textarea-content" 
            placeholder="Write your note here... (supports multiline text)"
          >${escapeHtml(note?.content || '')}</textarea>

          <label class="pin-checkbox-label">
            <input type="checkbox" id="modal-note-pin" ${note?.is_pinned ? 'checked' : ''} />
            <span>Pin this note to the top</span>
          </label>
        </div>
        <div class="modal-footer">
          <button type="button" id="modal-cancel-btn" class="btn-secondary">Cancel</button>
          <button type="submit" id="modal-save-btn" class="btn-primary">
            <span>${isEditing ? 'Save Changes' : 'Create Note'}</span>
          </button>
        </div>
      </form>
    </div>
  `;

  return overlay;
}
