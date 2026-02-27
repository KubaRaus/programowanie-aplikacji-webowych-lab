import './style.css';
import { ProjectService } from './services/ProjectService';
import type { Project } from './models/Project';

const service = new ProjectService();
let editingId: string | null = null;

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <div class="container">
    <header>
      <h1>ManageMe</h1>
      <p class="subtitle">Zarządzaj swoimi projektami</p>
    </header>

    <section class="form-section">
      <h2 id="form-title">Nowy projekt</h2>
      <form id="project-form">
        <div class="form-group">
          <label for="project-name">Nazwa projektu</label>
          <input type="text" id="project-name" placeholder="Wpisz nazwę..." required />
        </div>
        <div class="form-group">
          <label for="project-desc">Opis</label>
          <textarea id="project-desc" placeholder="Opisz projekt..." rows="3"></textarea>
        </div>
        <div class="form-actions">
          <button type="submit" id="submit-btn" class="btn btn-primary">Dodaj projekt</button>
          <button type="button" id="cancel-btn" class="btn btn-secondary hidden">Anuluj</button>
        </div>
      </form>
    </section>

    <section class="list-section">
      <h2>Projekty <span id="project-count" class="badge">0</span></h2>
      <div id="project-list" class="project-list"></div>
    </section>
  </div>
`;

const form = document.querySelector<HTMLFormElement>('#project-form')!;
const nameInput = document.querySelector<HTMLInputElement>('#project-name')!;
const descInput = document.querySelector<HTMLTextAreaElement>('#project-desc')!;
const submitBtn = document.querySelector<HTMLButtonElement>('#submit-btn')!;
const cancelBtn = document.querySelector<HTMLButtonElement>('#cancel-btn')!;
const formTitle = document.querySelector<HTMLHeadingElement>('#form-title')!;
const projectList = document.querySelector<HTMLDivElement>('#project-list')!;
const projectCount = document.querySelector<HTMLSpanElement>('#project-count')!;

function renderProjects(): void {
  const projects = service.getProjects();
  projectCount.textContent = String(projects.length);

  if (projects.length === 0) {
    projectList.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">📂</span>
        <p>Brak projektów. Dodaj pierwszy projekt!</p>
      </div>
    `;
    return;
  }

  projectList.innerHTML = projects
    .map((p: Project) => `
      <div class="project-card" data-id="${p.id}">
        <div class="project-info">
          <h3 class="project-name">${escapeHtml(p.name)}</h3>
          <p class="project-desc">${escapeHtml(p.description) || '<em>Brak opisu</em>'}</p>
          <span class="project-id">ID: ${p.id}</span>
        </div>
        <div class="project-actions">
          <button class="btn btn-edit" data-id="${p.id}">Edytuj</button>
          <button class="btn btn-delete" data-id="${p.id}">Usuń</button>
        </div>
      </div>
    `)
    .join('');

  projectList.querySelectorAll('.btn-edit').forEach((btn) => {
    btn.addEventListener('click', () => startEdit((btn as HTMLElement).dataset.id!));
  });
  projectList.querySelectorAll('.btn-delete').forEach((btn) => {
    btn.addEventListener('click', () => deleteProject((btn as HTMLElement).dataset.id!));
  });
}

function startEdit(id: string): void {
  const project = service.getProjectById(id);
  if (!project) return;

  editingId = id;
  nameInput.value = project.name;
  descInput.value = project.description;
  formTitle.textContent = 'Edytuj projekt';
  submitBtn.textContent = 'Zapisz zmiany';
  cancelBtn.classList.remove('hidden');
  nameInput.focus();
}

function cancelEdit(): void {
  editingId = null;
  form.reset();
  formTitle.textContent = 'Nowy projekt';
  submitBtn.textContent = 'Dodaj projekt';
  cancelBtn.classList.add('hidden');
}

function deleteProject(id: string): void {
  if (!confirm('Czy na pewno chcesz usunąć ten projekt?')) return;
  service.deleteProject(id);
  if (editingId === id) cancelEdit();
  renderProjects();
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = nameInput.value.trim();
  const description = descInput.value.trim();

  if (!name) return;

  if (editingId) {
    service.updateProject(editingId, name, description);
    cancelEdit();
  } else {
    service.createProject(name, description);
    form.reset();
  }

  renderProjects();
});

cancelBtn.addEventListener('click', cancelEdit);

renderProjects();
