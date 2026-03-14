class Task {
  constructor({ id, title, description, priority, category, completed = false, createdAt = Date.now() }) {
    this.id = id ?? crypto.randomUUID();
    this.title = title;
    this.description = description;
    this.priority = priority;
    this.category = category;
    this.completed = completed;
    this.createdAt = createdAt;
  }

  update({ title, description, priority, category }) {
    if (title) this.title = title;
    if (description) this.description = description;
    if (priority) this.priority = priority;
    if (category) this.category = category;
  }

  toggleComplete() {
    this.completed = !this.completed;
  }
}

class TaskManager {
  constructor() {
    this.tasks = [];
  }

  addTask(taskData) {
    const task = new Task({ ...taskData });
    this.tasks.unshift(task);
    return task;
  }

  updateTask(id, updates) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return null;
    task.update(updates);
    return task;
  }

  deleteTask(id) {
    const before = this.tasks.length;
    this.tasks = this.tasks.filter((t) => t.id !== id);
    return this.tasks.length < before;
  }

  toggleTaskCompletion(id) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return null;
    task.toggleComplete();
    return task;
  }

  filter({ category = 'all', search = '', sort = 'none' } = {}) {
    let filtered = [...this.tasks];
    if (category !== 'all') filtered = filtered.filter((t) => t.category === category);
    if (search.trim()) {
      const query = search.trim().toLowerCase();
      filtered = filtered.filter((t) => t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query));
    }

    if (sort === 'high') {
      const ranking = { high: 1, medium: 2, low: 3 };
      filtered.sort((a, b) => ranking[a.priority] - ranking[b.priority]);
    } else if (sort === 'low') {
      const ranking = { low: 1, medium: 2, high: 3 };
      filtered.sort((a, b) => ranking[a.priority] - ranking[b.priority]);
    }

    return filtered;
  }
}

const manager = new TaskManager();

const taskForm = document.getElementById('taskForm');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const priorityInput = document.getElementById('priority');
const categoryInput = document.getElementById('category');
const submitBtn = document.getElementById('submitBtn');
const resetBtn = document.getElementById('resetBtn');
const errorDiv = document.getElementById('error');
const taskList = document.getElementById('taskList');
const notificationBar = document.getElementById('notificationBar');
const filterCategory = document.getElementById('filterCategory');
const searchInput = document.getElementById('search');
const sortPriority = document.getElementById('sortPriority');
const themeToggle = document.getElementById('themeToggle');

let editingTaskId = null;
let notificationTimeoutId = null;

function showNotification(message, type = 'info') {
  notificationBar.textContent = message;
  notificationBar.style.color = type === 'error' ? '#dc2626' : type === 'success' ? '#16a34a' : '#111827';
  clearTimeout(notificationTimeoutId);
  notificationTimeoutId = setTimeout(() => { notificationBar.textContent = ''; }, 3500);
}

function renderTasks() {
  const category = filterCategory.value;
  const search = searchInput.value;
  const sort = sortPriority.value;
  const tasks = manager.filter({ category, search, sort });

  taskList.innerHTML = '';
  if (!tasks.length) {
    taskList.innerHTML = '<p style="margin:0; color:#6b7280;">No tasks found. Add a task to start.</p>';
    return;
  }

  for (const task of tasks) {
    const card = document.createElement('article');
    card.className = 'task-card';

    const left = document.createElement('div');
    left.className = 'task-left';

    const title = document.createElement('h3');
    title.className = `task-title ${task.completed ? 'completed' : ''}`;
    title.textContent = task.title;
    left.appendChild(title);

    const desc = document.createElement('p');
    desc.className = 'task-meta';
    desc.textContent = task.description;
    left.appendChild(desc);

    const meta = document.createElement('p');
    meta.className = 'task-meta';
    meta.textContent = `${task.category} • Created ${new Date(task.createdAt).toLocaleString()}`;
    left.appendChild(meta);

    const badge = document.createElement('span');
    badge.className = `badge ${task.priority}`;
    badge.textContent = task.priority;
    left.appendChild(badge);

    if (task.completed) {
      const done = document.createElement('span');
      done.className = 'completed-label';
      done.textContent = 'Completed';
      left.appendChild(done);
    }

    const right = document.createElement('div');
    right.className = 'task-right';

    const controls = document.createElement('div');
    controls.className = 'task-controls';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit';
    editBtn.textContent = 'Edit';
    editBtn.onclick = () => beginEditTask(task);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => {
      manager.deleteTask(task.id);
      renderTasks();
      showNotification('Task deleted.');
    };

    const completeBtn = document.createElement('button');
    completeBtn.className = task.completed ? 'restore' : 'complete';
    completeBtn.textContent = task.completed ? 'Undo' : 'Complete';
    completeBtn.onclick = () => {
      const updated = manager.toggleTaskCompletion(task.id);
      if (updated.completed) {
        showNotification('Task marked complete.', 'success');
      } else {
        showNotification('Task marked incomplete.', 'success');
      }
      renderTasks();
    };

    controls.append(editBtn, deleteBtn, completeBtn);
    right.appendChild(controls);
    card.append(left, right);
    taskList.appendChild(card);
  }
}

function validateForm() {
  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();
  if (!title) return 'Title is required.';
  if (!description) return 'Description is required.';
  if (!priorityInput.value) return 'Priority is required.';
  if (!categoryInput.value) return 'Category is required.';
  return '';
}

function resetForm() {
  taskForm.reset();
  editingTaskId = null;
  submitBtn.textContent = 'Add Task';
  errorDiv.textContent = '';
}

function beginEditTask(task) {
  editingTaskId = task.id;
  titleInput.value = task.title;
  descriptionInput.value = task.description;
  priorityInput.value = task.priority;
  categoryInput.value = task.category;
  submitBtn.textContent = 'Save Changes';
  errorDiv.textContent = '';
  titleInput.focus();
}

taskForm.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const err = validateForm();
  if (err) {
    errorDiv.textContent = err;
    return;
  }

  const taskData = {
    title: titleInput.value.trim(),
    description: descriptionInput.value.trim(),
    priority: priorityInput.value,
    category: categoryInput.value,
  };

  if (editingTaskId) {
    const updatedTask = manager.updateTask(editingTaskId, taskData);
    if (updatedTask) {
      showNotification(`Task updated. ${updatedTask.priority === 'high' ? 'HIGH priority notice!' : ''}`, updatedTask.priority === 'high' ? 'error' : 'success');
    }
    editingTaskId = null;
    submitBtn.textContent = 'Add Task';
  } else {
    const newTask = manager.addTask(taskData);
    showNotification(`Task added${newTask.priority === 'high' ? ' (High priority!)' : ''}`);
  }

  taskForm.reset();
  errorDiv.textContent = '';
  renderTasks();
});

resetBtn.addEventListener('click', resetForm);
filterCategory.addEventListener('input', renderTasks);
searchInput.addEventListener('input', renderTasks);
sortPriority.addEventListener('change', renderTasks);

themeToggle.addEventListener('click', () => {
  const body = document.body;
  body.classList.toggle('dark');
  const isDark = body.classList.contains('dark');
  themeToggle.textContent = isDark ? '☀️ Light' : '🌙 Dark';
});

renderTasks();
