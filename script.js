const TASKS_KEY = "taskflow_tasks";
const CATEGORIES_KEY = "taskflow_categories";
const PROFILE_KEY = "taskflow_rpg_profile";
const THEME_KEY = "taskflow_theme";

const defaultCategories = [
  { name: "School", color: "#6c8cff" },
  { name: "Work", color: "#28a67a" },
  { name: "Personal", color: "#d58a16" },
  { name: "Shopping", color: "#d94b5c" },
];

const achievements = [
  { id: "complete-10", title: "Complete 10 tasks", target: 10, reward: 50 },
  { id: "complete-50", title: "Complete 50 tasks", target: 50, reward: 180 },
  { id: "complete-100", title: "Complete 100 tasks", target: 100, reward: 400 },
];

const shopItems = [
  { id: "focus-break", title: "Focus Break", description: "Take a guilt-free 10 minute break.", cost: 40 },
  { id: "theme-token", title: "Theme Token", description: "Claim a small cosmetic reward.", cost: 90 },
  { id: "boss-pass", title: "Boss Pass", description: "Skip one tiny task and keep momentum.", cost: 160 },
];

const defaultProfile = {
  totalXp: 0,
  coins: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastCompletionDate: "",
  dailyGoal: 3,
  unlockedAchievements: [],
  purchasedItems: [],
};

let tasks = migrateTasks(loadTasks());
let categories = loadCategories();
let profile = loadProfile();
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
  xpPreview: document.getElementById("xpPreview"),
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
  bestStreak: document.getElementById("bestStreak"),
  todayLabel: document.getElementById("todayLabel"),
  playerLevel: document.getElementById("playerLevel"),
  levelRing: document.getElementById("levelRing"),
  xpText: document.getElementById("xpText"),
  totalXpText: document.getElementById("totalXpText"),
  xpFill: document.getElementById("xpFill"),
  coinCount: document.getElementById("coinCount"),
  currentStreak: document.getElementById("currentStreak"),
  productivityScore: document.getElementById("productivityScore"),
  dailyGoalText: document.getElementById("dailyGoalText"),
  dailyGoalInput: document.getElementById("dailyGoalInput"),
  dailyGoalFill: document.getElementById("dailyGoalFill"),
  achievementList: document.getElementById("achievementList"),
  shopList: document.getElementById("shopList"),
  statisticsGrid: document.getElementById("statisticsGrid"),
};

saveTasks();
saveProfile();

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

function loadProfile() {
  const savedProfile = localStorage.getItem(PROFILE_KEY);
  return savedProfile ? { ...defaultProfile, ...JSON.parse(savedProfile) } : { ...defaultProfile };
}

function saveProfile() {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function migrateTasks(savedTasks) {
  return savedTasks.map((task) => {
    const migratedTask = { ...task };

    if (typeof migratedTask.priority !== "number") {
      const priorityMap = { Low: 25, Medium: 60, High: 90 };
      migratedTask.priority = priorityMap[migratedTask.priority] || 50;
    }

    if (typeof migratedTask.xpAwarded !== "boolean") {
      migratedTask.xpAwarded = false;
    }

    if (!migratedTask.completedAt) {
      migratedTask.completedAt = "";
    }

    return migratedTask;
  });
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
    elements.formTitle.textContent = "Edit quest";
    elements.taskId.value = task.id;
    elements.taskTitle.value = task.title;
    elements.taskDescription.value = task.description;
    elements.taskCategory.value = task.category;
    elements.taskPriority.value = task.priority;
    elements.taskDueDate.value = task.dueDate;
  } else {
    elements.formTitle.textContent = "Add quest";
    elements.taskId.value = "";
    elements.taskPriority.value = 50;
    elements.taskCategory.value = categories[0]?.name || "";
  }

  updateXpPreview();
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
    priority: clampPriority(elements.taskPriority.value),
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
      xpAwarded: false,
      completedAt: "",
      createdAt: new Date().toISOString(),
    });
  }

  saveTasks();
  closeForm();
  renderApp();
}

function deleteTask(taskId) {
  if (!confirm("Delete this quest?")) {
    return;
  }

  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  renderApp();
}

function toggleTaskCompletion(taskId) {
  tasks = tasks.map((task) => {
    if (task.id !== taskId) {
      return task;
    }

    if (task.completed) {
      return { ...task, completed: false };
    }

    const completedTask = {
      ...task,
      completed: true,
      completedAt: new Date().toISOString(),
    };

    if (!task.xpAwarded) {
      awardQuestRewards(completedTask);
      completedTask.xpAwarded = true;
    }

    return completedTask;
  });

  unlockAchievements();
  saveTasks();
  saveProfile();
  renderApp();
}

function awardQuestRewards(task) {
  profile.totalXp += calculateXp(task.priority);
  profile.coins += calculateCoins(task.priority);
  updateStreak();
}

function updateStreak() {
  const today = getDateKey(new Date());
  const yesterday = getDateKey(addDays(new Date(), -1));

  if (profile.lastCompletionDate === today) {
    return;
  }

  profile.currentStreak = profile.lastCompletionDate === yesterday ? profile.currentStreak + 1 : 1;
  profile.bestStreak = Math.max(profile.bestStreak, profile.currentStreak);
  profile.lastCompletionDate = today;
}

function unlockAchievements() {
  const completedCount = getAwardedCompletionCount();

  achievements.forEach((achievement) => {
    if (completedCount >= achievement.target && !profile.unlockedAchievements.includes(achievement.id)) {
      profile.unlockedAchievements.push(achievement.id);
      profile.coins += achievement.reward;
    }
  });
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
      ? `Delete "${categoryName}"? ${taskCount} quest(s) will move to "${fallbackCategory.name}".`
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

function buyShopItem(itemId) {
  const item = shopItems.find((shopItem) => shopItem.id === itemId);

  if (!item || profile.purchasedItems.includes(itemId)) {
    return;
  }

  if (profile.coins < item.cost) {
    alert("Not enough coins yet.");
    return;
  }

  profile.coins -= item.cost;
  profile.purchasedItems.push(itemId);
  saveProfile();
  renderApp();
}

function categoryExists(name) {
  return categories.some((category) => category.name.toLowerCase() === name.toLowerCase());
}

function getCategory(name) {
  return categories.find((category) => category.name === name) || categories[0] || defaultCategories[0];
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
        <strong>No quests found</strong>
        <span>Add a new quest or adjust your filters.</span>
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
  const xp = calculateXp(task.priority);
  const coins = calculateCoins(task.priority);

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
          <span class="chip priority-number">Priority ${task.priority}/100</span>
          <span class="chip xp-chip">${xp} XP</span>
          <span class="chip">${coins} coins</span>
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
      <span>All Quests</span>
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

  elements.totalTasks.textContent = total;
  elements.completedTasks.textContent = completed;
  elements.activeTasks.textContent = active;
  elements.bestStreak.textContent = profile.bestStreak;
}

function renderRpgProfile() {
  const levelInfo = getLevelInfo(profile.totalXp);
  const todayCompleted = getTodayCompletedCount();
  const dailyPercent = Math.min(100, Math.round((todayCompleted / profile.dailyGoal) * 100));

  elements.playerLevel.textContent = levelInfo.level;
  elements.levelRing.textContent = `${levelInfo.percent}%`;
  elements.levelRing.style.background = `conic-gradient(var(--accent) ${levelInfo.percent}%, var(--surface-soft) 0)`;
  elements.xpText.textContent = `${levelInfo.currentXp} / ${levelInfo.nextLevelXp} XP`;
  elements.totalXpText.textContent = `${profile.totalXp} total XP`;
  elements.xpFill.style.width = `${levelInfo.percent}%`;
  elements.coinCount.textContent = profile.coins;
  elements.currentStreak.textContent = profile.currentStreak;
  elements.productivityScore.textContent = calculateProductivityScore();
  elements.dailyGoalInput.value = profile.dailyGoal;
  elements.dailyGoalText.textContent = `${todayCompleted} / ${profile.dailyGoal} quests`;
  elements.dailyGoalFill.style.width = `${dailyPercent}%`;
}

function renderAchievements() {
  const completedCount = getAwardedCompletionCount();

  elements.achievementList.innerHTML = achievements
    .map((achievement) => {
      const unlocked = profile.unlockedAchievements.includes(achievement.id);
      const percent = Math.min(100, Math.round((completedCount / achievement.target) * 100));

      return `
        <article class="achievement-card ${unlocked ? "unlocked" : ""}">
          <div>
            <strong>${achievement.title}</strong>
            <span>${Math.min(completedCount, achievement.target)} / ${achievement.target}</span>
          </div>
          <div class="progress-track mini" aria-hidden="true">
            <div class="progress-fill achievement-fill" style="width: ${percent}%"></div>
          </div>
          <small>${unlocked ? "Unlocked" : `Reward: ${achievement.reward} coins`}</small>
        </article>
      `;
    })
    .join("");
}

function renderShop() {
  elements.shopList.innerHTML = shopItems
    .map((item) => {
      const purchased = profile.purchasedItems.includes(item.id);
      const affordable = profile.coins >= item.cost;

      return `
        <article class="shop-card ${purchased ? "purchased" : ""}">
          <div>
            <strong>${item.title}</strong>
            <p>${item.description}</p>
            <span>${item.cost} coins</span>
          </div>
          <button
            type="button"
            data-shop-id="${item.id}"
            ${purchased || !affordable ? "disabled" : ""}
          >
            ${purchased ? "Owned" : "Buy"}
          </button>
        </article>
      `;
    })
    .join("");
}

function renderStatistics() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const active = total - completed;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);
  const todayCompleted = getTodayCompletedCount();
  const score = calculateProductivityScore();

  const stats = [
    ["Completion rate", `${completionRate}%`],
    ["Today completed", todayCompleted],
    ["Daily target", profile.dailyGoal],
    ["Current streak", profile.currentStreak],
    ["Best streak", profile.bestStreak],
    ["Total XP", profile.totalXp],
    ["Coins", profile.coins],
    ["Active quests", active],
    ["Productivity score", score],
  ];

  elements.statisticsGrid.innerHTML = stats
    .map(
      ([label, value]) => `
        <article class="stat-tile">
          <span>${label}</span>
          <strong>${value}</strong>
        </article>
      `
    )
    .join("");
}

function renderApp() {
  renderCategoryOptions();
  renderCategoryNavigation();
  renderCategorySettings();
  renderStats();
  renderRpgProfile();
  renderAchievements();
  renderShop();
  renderStatistics();
  renderTasks();
}

function updateXpPreview() {
  const priority = clampPriority(elements.taskPriority.value);
  elements.xpPreview.textContent = `Reward: ${calculateXp(priority)} XP and ${calculateCoins(priority)} coins`;
}

function calculateXp(priority) {
  return 10 + Math.round(clampPriority(priority) * 0.9);
}

function calculateCoins(priority) {
  return 3 + Math.round(clampPriority(priority) / 10);
}

function clampPriority(value) {
  const number = Number(value);
  if (Number.isNaN(number)) {
    return 50;
  }
  return Math.min(100, Math.max(1, Math.round(number)));
}

function getLevelInfo(totalXp) {
  let level = 1;
  let remainingXp = totalXp;
  let nextLevelXp = getXpForLevel(level);

  while (remainingXp >= nextLevelXp) {
    remainingXp -= nextLevelXp;
    level += 1;
    nextLevelXp = getXpForLevel(level);
  }

  return {
    level,
    currentXp: remainingXp,
    nextLevelXp,
    percent: Math.round((remainingXp / nextLevelXp) * 100),
  };
}

function getXpForLevel(level) {
  return 100 + (level - 1) * 45;
}

function calculateProductivityScore() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const completionScore = total === 0 ? 0 : Math.round((completed / total) * 60);
  const streakScore = Math.min(25, profile.currentStreak * 5);
  const goalScore = Math.min(15, Math.round((getTodayCompletedCount() / profile.dailyGoal) * 15));
  return Math.min(100, completionScore + streakScore + goalScore);
}

function getAwardedCompletionCount() {
  return tasks.filter((task) => task.xpAwarded).length;
}

function getTodayCompletedCount() {
  const today = getDateKey(new Date());
  return tasks.filter((task) => task.completedAt && getDateKey(new Date(task.completedAt)) === today).length;
}

function getDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
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
elements.taskPriority.addEventListener("input", updateXpPreview);

elements.dailyGoalInput.addEventListener("change", (event) => {
  profile.dailyGoal = Math.min(25, Math.max(1, Math.round(Number(event.target.value) || 3)));
  saveProfile();
  renderApp();
});

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

elements.shopList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-shop-id]");

  if (button) {
    buyShopItem(button.dataset.shopId);
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
unlockAchievements();
renderApp();
