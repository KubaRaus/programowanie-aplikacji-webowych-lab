export function renderAppLayout(
  app: HTMLDivElement,
  superAdminEmail: string,
  escapeHtml: (text: string) => string,
): void {
  app.innerHTML = `
  <div id="login-view" class="auth-view hidden">
    <h1>ManageMe</h1>
    <p class="subtitle">Zaloguj sie przez Google, aby kontynuowac.</p>
    <div id="google-login-button" class="google-login"></div>
    <p id="login-error" class="auth-message hidden"></p>
    <p class="auth-hint">
      Super admin email: <strong>${escapeHtml(superAdminEmail)}</strong>
    </p>
  </div>

  <div id="blocked-view" class="auth-view hidden">
    <h1>Konto zablokowane</h1>
    <p class="subtitle">To konto nie ma dostepu do aplikacji. Skontaktuj sie z administratorem.</p>
    <button type="button" id="blocked-logout-btn" class="btn btn-secondary">Wyloguj</button>
  </div>

  <div id="app-shell" class="container hidden">
    <header>
      <h1>ManageMe</h1>
      <p class="subtitle">Zarzadzaj projektami, historyjkami i zadaniami</p>
      <div class="header-toolbar">
        <p class="logged-user">
          Zalogowany:
          <strong id="logged-user-name"></strong>
          <button type="button" id="unread-counter-btn" class="notification-counter" aria-label="Przejdz do powiadomien">
            🔔
            <span id="unread-counter-value">0</span>
          </button>
        </p>
        <nav class="header-nav">
          <button type="button" id="menu-board-btn" class="nav-link active">Tablica</button>
          <button type="button" id="menu-notifications-btn" class="nav-link">Powiadomienia</button>
          <button type="button" id="menu-users-btn" class="nav-link hidden">Uzytkownicy</button>
        </nav>
      </div>
      <div class="header-actions">
        <button type="button" id="theme-toggle-btn" class="theme-toggle">🌙 Ciemny</button>
        <button type="button" id="logout-btn" class="btn btn-secondary">Wyloguj</button>
      </div>
    </header>

    <section id="guest-pending-view" class="notifications-view hidden">
      <div class="notifications-header">
        <h2>Oczekiwanie na zatwierdzenie konta</h2>
      </div>
      <p class="column-empty">Twoje konto ma role goscia. Administrator musi zmienic role, aby odblokowac dostep do aplikacji.</p>
    </section>

    <section id="board-view">
      <section class="form-section">
      <h2 id="project-form-title">Nowy projekt</h2>
      <form id="project-form">
        <div class="form-group">
          <label for="project-name">Nazwa projektu</label>
          <input type="text" id="project-name" placeholder="Wpisz nazwe..." required />
        </div>
        <div class="form-group">
          <label for="project-desc">Opis</label>
          <textarea id="project-desc" placeholder="Opisz projekt..." rows="3"></textarea>
        </div>
        <div class="form-actions">
          <button type="submit" id="project-submit-btn" class="btn btn-primary">Dodaj projekt</button>
          <button type="button" id="project-cancel-btn" class="btn btn-secondary hidden">Anuluj</button>
        </div>
      </form>
    </section>

    <section class="list-section">
      <h2>Projekty <span id="project-count" class="badge">0</span></h2>
      <div id="project-list" class="project-list"></div>
    </section>

    <section class="story-section">
      <div class="story-header">
        <h2>Historyjki</h2>
        <p id="active-project-label" class="active-project-label"></p>
      </div>

      <form id="story-form" class="story-form hidden">
        <h3 id="story-form-title">Nowa historyjka</h3>
        <div class="form-group">
          <label for="story-name">Nazwa</label>
          <input type="text" id="story-name" placeholder="Np. Logowanie przez SSO" required />
        </div>
        <div class="form-group">
          <label for="story-desc">Opis</label>
          <textarea id="story-desc" rows="3" placeholder="Szczegoly historyjki..."></textarea>
        </div>
        <div class="story-grid">
          <div class="form-group">
            <label for="story-priority">Priorytet</label>
            <select id="story-priority">
              <option value="niski">Niski</option>
              <option value="sredni" selected>Sredni</option>
              <option value="wysoki">Wysoki</option>
            </select>
          </div>
          <div class="form-group">
            <label for="story-status">Stan</label>
            <select id="story-status">
              <option value="todo" selected>Todo</option>
              <option value="doing">Doing</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" id="story-submit-btn" class="btn btn-primary">Dodaj historyjke</button>
          <button type="button" id="story-cancel-btn" class="btn btn-secondary hidden">Anuluj</button>
        </div>
      </form>

      <div id="story-board" class="story-board"></div>
    </section>

    <section class="task-section">
      <div class="task-header">
        <h2>Zadania</h2>
        <p id="task-project-label" class="active-project-label"></p>
      </div>

      <form id="task-form" class="task-form hidden">
        <h3 id="task-form-title">Nowe zadanie</h3>
        <div class="form-group">
          <label for="task-name">Nazwa</label>
          <input type="text" id="task-name" placeholder="Np. Konfiguracja pipeline CI" required />
        </div>
        <div class="form-group">
          <label for="task-desc">Opis</label>
          <textarea id="task-desc" rows="3" placeholder="Szczegoly zadania..."></textarea>
        </div>
        <div class="task-grid">
          <div class="form-group">
            <label for="task-priority">Priorytet</label>
            <select id="task-priority">
              <option value="niski">Niski</option>
              <option value="sredni" selected>Sredni</option>
              <option value="wysoki">Wysoki</option>
            </select>
          </div>
          <div class="form-group">
            <label for="task-story">Historyjka</label>
            <select id="task-story"></select>
          </div>
          <div class="form-group">
            <label for="task-estimated-hours">Przewidywany czas (h)</label>
            <input type="number" id="task-estimated-hours" min="1" step="1" value="1" required />
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" id="task-submit-btn" class="btn btn-primary">Dodaj zadanie</button>
          <button type="button" id="task-cancel-btn" class="btn btn-secondary hidden">Anuluj</button>
        </div>
      </form>

      <div id="task-board" class="task-board"></div>
      <div id="task-details" class="task-details"></div>
      </section>
    </section>

    <section id="notifications-view" class="notifications-view hidden">
      <div class="notifications-header">
        <h2>Wszystkie powiadomienia</h2>
        <button type="button" id="notifications-back-btn" class="btn btn-secondary">Powrot do tablicy</button>
      </div>
      <div id="notifications-list" class="notifications-list"></div>
    </section>

    <section id="notification-details-view" class="notifications-view hidden">
      <div class="notifications-header">
        <h2>Szczegoly powiadomienia</h2>
        <button type="button" id="notification-details-back-btn" class="btn btn-secondary">Wroc do listy</button>
      </div>
      <div id="notification-details" class="task-details"></div>
    </section>

    <section id="users-view" class="notifications-view hidden">
      <div class="notifications-header">
        <h2>Lista uzytkownikow</h2>
      </div>
      <div id="users-list" class="users-list"></div>
    </section>

    <div id="notification-modal-backdrop" class="modal-backdrop hidden">
      <div class="notification-modal">
        <h3 id="notification-modal-title"></h3>
        <p id="notification-modal-message"></p>
        <div class="notification-modal-meta">
          <span id="notification-modal-priority"></span>
          <span id="notification-modal-date"></span>
        </div>
        <div class="notification-modal-actions">
          <button type="button" id="notification-modal-open-btn" class="btn btn-primary">Otworz</button>
          <button type="button" id="notification-modal-close-btn" class="btn btn-secondary">Zamknij</button>
        </div>
      </div>
    </div>
  </div>
`;
}
