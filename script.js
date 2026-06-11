const TASKS_KEY = "taskflow_tasks";
const CATEGORIES_KEY = "taskflow_categories";
const THEME_KEY = "taskflow_theme";

const defaultCategories = [
  { name: "School", color: "#6c8cff" },
  { name: "Work", color: "#28a67a" },
  { name: "Personal", color: "#d58a16" },
  { name: "Shopping", color: "#d94b5c" },
];

let tasks = loadTasks();
let categories = loadCategories();
let activeCategory = "All";
let activeStatus = "All";
let searchTerm = "";

const elements = {
  taskList: document.getElementById("taskList"),
  taskForm: document.getElementById("taskForm"),
  taskModal: document.getElementById("taskModal"),
  formTitle: document.getElementById("formTitle"),
  taskId: document.getElementById("taskId"),
  taskTitle: document.getElementById("taskTitle"),
  taskDescription: document.getElementById("taskDescription"),
  taskCategory: document.getElementById("taskCategory"),
  taskPriority: document.getElementById("taskPriority"),
  taskDueDate: document.getElementById("taskDueDate"),
  openTaskForm: document.getElementById("openTaskForm"),
  closeTaskForm: document.getElementById("closeTaskForm"),
  cancelTaskForm: document.getElementById("cancelTaskForm"),
  searchInput: document.getElementById("searchInput"),
  categoryFilter: document.getElementById("categoryFilter"),
  statusFilter: document.getElementById("statusFilter"),
  categoryNav: document.getElementById("categoryNav"),
  openCategorySettings: document.getElementById("openCategorySettings"),
  closeCategorySettings: document.getElementById("closeCategorySettings"),
  categoryModal: document.getElementById("categoryModal"),
  categoryForm: document.getElementById("categoryForm"),
  categoryName: document.getElementById("categoryName"),
  categoryColor: document.getElementById("categoryColor"),
  categorySettingsList: document.getElementById("categorySettingsList"),
  themeToggle: document.getElementById("themeToggle"),
  themeIcon: document.getElementById("themeIcon"),
  themeLabel: document.getElementById("themeLabel"),
  totalTasks: document.getElementById("totalTasks"),
  completedTasks: document.getElementById("completedTasks"),
  activeTasks: document.getElementById("activeTasks"),
  progressPercent: document.getElementById("progressPercent"),
  progressFill: document.getElementById("progressFill"),
  todayLabel: document.getElementById("todayLabel"),
};

function loadTasks() {
  const savedTasks = localStorage.getItem(TASKS_KEY);
  return savedTasks ? JSON.parse(savedTasks) : [];
}

function saveTasks() {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function loadCategories() {
  const savedCategories = localStorage.getItem(CATEGORIES_KEY);
  return savedCategories ? JSON.parse(savedCategories) : defaultCategories;
}

function saveCategories() {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}

function setTodayLabel() {
  const today = new Date();
  elements.todayLabel.textContent = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function openForm(task = null) {
  elements.taskForm.reset();
  renderCategoryOptions();

  if (task) {
    elements.formTitle.textContent = "Edit task";
    elements.taskId.value = task.id;
    elements.taskTitle.value = task.title;
    elements.taskDescription.value = task.description;
    elements.taskCategory.value = task.category;
    elements.taskPriority.value = task.priority;
    elements.taskDueDate.value = task.dueDate;
  } else {
    elements.formTitle.textContent = "Add task";
    elements.taskId.value = "";
    elements.taskCategory.value = categories[0]?.name || "";
  }

  elements.taskModal.classList.remove("hidden");
  elements.taskTitle.focus();
}

function closeForm() {
  elements.taskModal.classList.add("hidden");
  elements.taskForm.reset();
  elements.taskId.value = "";
}

function handleTaskSubmit(event) {
  event.preventDefault();

  const taskData = {
    title: elements.taskTitle.value.trim(),
    description: elements.taskDescription.value.trim(),
    category: elements.taskCategory.value,
    priority: elements.taskPriority.value,
    dueDate: elements.taskDueDate.value,
  };

  if (!taskData.title || !taskData.category) {
    return;
  }

  const existingTaskId = elements.taskId.value;

  if (existingTaskId) {
    tasks = tasks.map((task) =>
      task.id === existingTaskId ? { ...task, ...taskData } : task
    );
  } else {
    tasks.unshift({
      id: crypto.randomUUID(),
      ...taskData,
      completed: false,
      createdAt: new Date().toISOString(),
    });
  }

  saveTasks();
  closeForm();
  renderApp();
}

function deleteTask(taskId) {
  if (!confirm("Delete this task?")) {
    return;
  }

  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  renderApp();
}

function toggleTaskCompletion(taskId) {
  tasks = tasks.map((task) =>
    task.id === taskId ? { ...task, completed: !task.completed } : task
  );
  saveTasks();
  renderApp();
}

function handleCategorySubmit(event) {
  event.preventDefault();

  const name = elements.categoryName.value.trim();
  const color = elements.categoryColor.value;

  if (!name || categoryExists(name)) {
    alert("Please enter a new category name.");
    return;
  }

  categories.push({ name, color });
  saveCategories();
  elements.categoryForm.reset();
  elements.categoryColor.value = "#5379f6";
  renderApp();
}

function updateCategory(oldName, newName, color) {
  const cleanName = newName.trim();

  if (!cleanName) {
    alert("Category name cannot be empty.");
    renderApp();
    return;
  }

  const duplicate = categories.some(
    (category) => category.name.toLowerCase() === cleanName.toLowerCase() && category.name !== oldName
  );

  if (duplicate) {
    alert("This category already exists.");
    renderApp();
    return;
  }

  categories = categories.map((category) =>
    category.name === oldName ? { name: cleanName, color } : category
  );

  tasks = tasks.map((task) =>
    task.category === oldName ? { ...task, category: cleanName } : task
  );

  if (activeCategory === oldName) {
    activeCategory = cleanName;
  }

  saveCategories();
  saveTasks();
  renderApp();
}

function deleteCategory(categoryName) {
  if (categories.length === 1) {
    alert("You need at least one category.");
    return;
  }

  const fallbackCategory = categories.find((category) => category.name !== categoryName);
  const taskCount = tasks.filter((task) => task.category === categoryName).length;
  const message =
    taskCount > 0
      ? `Delete "${categoryName}"? ${taskCount} task(s) will move to "${fallbackCategory.name}".`
      : `Delete "${categoryName}"?`;

  if (!confirm(message)) {
    return;
  }

  categories = categories.filter((category) => category.name !== categoryName);
  tasks = tasks.map((task) =>
    task.category === categoryName ? { ...task, category: fallbackCategory.name } : task
  );

  if (activeCategory === categoryName) {
    activeCategory = "All";
  }

  saveCategories();
  saveTasks();
  renderApp();
}

function categoryExists(name) {
  return categories.some((category) => category.name.toLowerCase() === name.toLowerCase());
}

function getCategory(name) {
  return categories.find((category) => category.name === name) || categories[0];
}

function getFilteredTasks() {
  return tasks.filter((task) => {
    const matchesCategory = activeCategory === "All" || task.category === activeCategory;
    const matchesStatus =
      activeStatus === "All" ||
      (activeStatus === "Completed" && task.completed) ||
      (activeStatus === "Active" && !task.completed);
    const searchableText = `${task.title} ${task.description}`.toLowerCase();
    const matchesSearch = searchableText.includes(searchTerm.toLowerCase());

    return matchesCategory && matchesStatus && matchesSearch;
  });
}

function renderTasks() {
  const filteredTasks = getFilteredTasks();

  if (filteredTasks.length === 0) {
    elements.taskList.innerHTML = `
      <div class="empty-state">
        <strong>No tasks found</strong>
        <span>Add a new task or adjust your filters.</span>
      </div>
    `;
    return;
  }

  elements.taskList.innerHTML = filteredTasks.map(createTaskCard).join("");
}

function createTaskCard(task) {
  const category = getCategory(task.category);
  const dueDateText = task.dueDate ? formatDueDate(task.dueDate) : "No due date";
  const description = task.description || "No description added.";

  return `
    <article class="task-card ${task.completed ? "completed" : ""}" style="--category-color: ${category.color}">
      <input
        class="complete-checkbox"
        type="checkbox"
        ${task.completed ? "checked" : ""}
        aria-label="Mark ${escapeHtml(task.title)} as completed"
        data-action="toggle"
        data-id="${task.id}"
      />
      <div>
        <h3 class="task-title">${escapeHtml(task.title)}</h3>
        <p class="task-description">${escapeHtml(description)}</p>
        <div class="task-meta">
          <span class="chip category-chip">
            <span class="color-dot" style="background: ${category.color}"></span>
            ${escapeHtml(task.category)}
          </span>
          <span class="chip priority-${task.priority.toLowerCase()}">${task.priority} priority</span>
          <span class="chip">${dueDateText}</span>
        </div>
      </div>
      <div class="task-actions">
        <button type="button" data-action="edit" data-id="${task.id}">Edit</button>
        <button type="button" data-action="delete" data-id="${task.id}">Delete</button>
      </div>
    </article>
  `;
}

function renderCategoryNavigation() {
  const total = tasks.length;
  const categoryButtons = categories
    .map((category) => {
      const count = tasks.filter((task) => task.category === category.name).length;
      const isActive = activeCategory === category.name ? "active" : "";

      return `
        <button class="category-button ${isActive}" data-category="${escapeHtml(category.name)}">
          <span>
            <span class="color-dot" style="background: ${category.color}"></span>
            ${escapeHtml(category.name)}
          </span>
          <strong>${count}</strong>
        </button>
      `;
    })
    .join("");

  elements.categoryNav.innerHTML = `
    <button class="category-button ${activeCategory === "All" ? "active" : ""}" data-category="All">
      <span>All Tasks</span>
      <strong>${total}</strong>
    </button>
    ${categoryButtons}
  `;
}

function renderCategoryOptions() {
  const categoryOptions = categories
    .map((category) => `<option value="${escapeHtml(category.name)}">${escapeHtml(category.name)}</option>`)
    .join("");

  elements.taskCategory.innerHTML = categoryOptions;
  elements.categoryFilter.innerHTML = `<option value="All">All</option>${categoryOptions}`;

  if (!categories.some((category) => category.name === activeCategory)) {
    activeCategory = "All";
  }

  elements.categoryFilter.value = activeCategory;
}

function renderCategorySettings() {
  elements.categorySettingsList.innerHTML = categories
    .map(
      (category) => `
        <div class="category-setting-row" data-category="${escapeHtml(category.name)}">
          <input class="category-edit-name" type="text" value="${escapeHtml(category.name)}" aria-label="Category name" />
          <input class="category-edit-color" type="color" value="${category.color}" aria-label="Category color" />
          <button class="secondary-button" type="button" data-action="save-category">Save</button>
          <button class="danger-button" type="button" data-action="delete-category">Delete</button>
        </div>
      `
    )
    .join("");
}

function renderStats() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const active = total - completed;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  elements.totalTasks.textContent = total;
  elements.completedTasks.textContent = completed;
  elements.activeTasks.textContent = active;
  elements.progressPercent.textContent = `${percent}%`;
  elements.progressFill.style.width = `${percent}%`;
}

function renderApp() {
  renderCategoryOptions();
  renderCategoryNavigation();
  renderCategorySettings();
  renderStats();
  renderTasks();
}

function formatDueDate(dateValue) {
  const date = new Date(`${dateValue}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark", isDark);
  elements.themeIcon.textContent = isDark ? "L" : "M";
  elements.themeLabel.textContent = isDark ? "Light mode" : "Dark mode";
  localStorage.setItem(THEME_KEY, theme);
}

function initializeTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(savedTheme);
}

elements.openTaskForm.addEventListener("click", () => openForm());
elements.closeTaskForm.addEventListener("click", closeForm);
elements.cancelTaskForm.addEventListener("click", closeForm);
elements.taskForm.addEventListener("submit", handleTaskSubmit);

elements.openCategorySettings.addEventListener("click", () => {
  elements.categoryModal.classList.remove("hidden");
});

elements.closeCategorySettings.addEventListener("click", () => {
  elements.categoryModal.classList.add("hidden");
});

elements.categoryForm.addEventListener("submit", handleCategorySubmit);

elements.searchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value;
  renderTasks();
});

elements.categoryFilter.addEventListener("change", (event) => {
  activeCategory = event.target.value;
  renderApp();
});

elements.statusFilter.addEventListener("change", (event) => {
  activeStatus = event.target.value;
  renderTasks();
});

elements.categoryNav.addEventListener("click", (event) => {
  const button = event.target.closest(".category-button");

  if (!button) {
    return;
  }

  activeCategory = button.dataset.category;
  renderApp();
});

elements.categorySettingsList.addEventListener("click", (event) => {
  const row = event.target.closest(".category-setting-row");

  if (!row) {
    return;
  }

  const oldName = row.dataset.category;
  const newName = row.querySelector(".category-edit-name").value;
  const color = row.querySelector(".category-edit-color").value;

  if (event.target.dataset.action === "save-category") {
    updateCategory(oldName, newName, color);
  }

  if (event.target.dataset.action === "delete-category") {
    deleteCategory(oldName);
  }
});

elements.taskList.addEventListener("click", (event) => {
  const target = event.target;
  const taskId = target.dataset.id;
  const action = target.dataset.action;

  if (!taskId || !action) {
    return;
  }

  if (action === "edit") {
    const task = tasks.find((item) => item.id === taskId);
    openForm(task);
  }

  if (action === "delete") {
    deleteTask(taskId);
  }
});

elements.taskList.addEventListener("change", (event) => {
  if (event.target.dataset.action === "toggle") {
    toggleTaskCompletion(event.target.dataset.id);
  }
});

elements.taskModal.addEventListener("click", (event) => {
  if (event.target === elements.taskModal) {
    closeForm();
  }
});

elements.categoryModal.addEventListener("click", (event) => {
  if (event.target === elements.categoryModal) {
    elements.categoryModal.classList.add("hidden");
  }
});

elements.themeToggle.addEventListener("click", () => {
  const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
  applyTheme(nextTheme);
});

setTodayLabel();
initializeTheme();
renderApp();
