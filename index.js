let tasks = JSON.parse(localStorage.getItem('nexusTasks')) || [];
let deletedTasks = JSON.parse(localStorage.getItem('nexusDeletedTasks')) || [];
let currentFilter = 'all';
let currentEditTaskId = null;
let currentDeleteTaskId = null;
let toastCounter = 0;
let selectedTaskIds = [];
let selectedDeletedTaskIds = [];

document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('taskDueDate').min = today;
    document.getElementById('editTaskDueDate').min = today;
    
    loadTasks();
    updateStats();
    setupEventListeners();
    startDeleteCountdown();
    
    setTimeout(() => {
        showToast('Welcome to Nexus Task Manager!', '', 'success');
    }, 1000);
}

function setupEventListeners() {
    document.getElementById('taskForm').addEventListener('submit', handleAddTask);
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            filterTasks(currentFilter);
        });
    });
    
    document.getElementById('taskSearch').addEventListener('input', function() {
        filterTasks(currentFilter, this.value);
    });
    
    document.getElementById('exportBtn').addEventListener('click', exportTasks);
    
    document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
    document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);
    
    document.getElementById('editTaskForm').addEventListener('submit', handleEditTask);
    
    document.getElementById('fab').addEventListener('click', function() {
        document.getElementById('taskTitle').focus();
        document.querySelector('.task-form-container').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
        
        this.classList.add('pulse');
        setTimeout(() => this.classList.remove('pulse'), 1000);
    });
    
    document.querySelectorAll('.task-form .priority-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.task-form .priority-option').forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            document.getElementById('taskPriority').value = this.dataset.priority;
        });
    });
    
    document.querySelectorAll('#editTaskForm .priority-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('#editTaskForm .priority-option').forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
            document.getElementById('editTaskPriority').value = this.dataset.priority;
        });
    });
    
    document.getElementById('closeDeleteModal').addEventListener('click', closeDeleteModal);
    document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);
    document.getElementById('confirmDeleteBtn').addEventListener('click', confirmDeleteTask);

    // Menu dropdown
    document.getElementById('menuIconBtn').addEventListener('click', function(e) {
        e.stopPropagation();
        const dropdown = document.getElementById('dropdownMenu');
        dropdown.classList.toggle('show');
    });

    document.addEventListener('click', function(e) {
        const dropdown = document.getElementById('dropdownMenu');
        const menuBtn = document.getElementById('menuIconBtn');
        if (!dropdown.contains(e.target) && !menuBtn.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });

    // All Delete
    document.getElementById('allDeleteBtn').addEventListener('click', function() {
        document.getElementById('dropdownMenu').classList.remove('show');
        if (tasks.length === 0) {
            showToast('No tasks to delete!', 'Add some tasks first.', 'warning');
            return;
        }
        currentDeleteTaskId = 'all';
        document.getElementById('deleteConfirmMessage').textContent = `Are you sure you want to delete all ${tasks.length} tasks?`;
        document.getElementById('deleteConfirmModal').classList.add('active');
    });

// Select Task
const selectBtn = document.getElementById('selectTaskBtn');
if (selectBtn) {
    selectBtn.addEventListener('click', function () {
        document.getElementById('dropdownMenu').classList.remove('show');
        openSelectTaskModal();
    });
}

    // Restore
    document.getElementById('restoreBtn').addEventListener('click', function() {
        document.getElementById('dropdownMenu').classList.remove('show');
        openRestoreModal();
    });

    // Select Task Modal
    document.getElementById('closeSelectModal').addEventListener('click', closeSelectTaskModal);
    document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelectedTasks);

    // Restore Modal
    document.getElementById('closeRestoreModal').addEventListener('click', closeRestoreModal);
    document.getElementById('restoreSelectedBtn').addEventListener('click', restoreSelectedTasks);
    document.getElementById('permanentDeleteBtn').addEventListener('click', permanentDeleteSelectedTasks);

    // Filter icon for mobile
    document.getElementById('filterIconBtn').addEventListener('click', function(e) {
        e.stopPropagation();
        const dropdown = document.getElementById('filterDropdown');
        dropdown.classList.toggle('show');
    });

    document.addEventListener('click', function(e) {
        const filterDropdown = document.getElementById('filterDropdown');
        const filterBtn = document.getElementById('filterIconBtn');
        if (!filterDropdown.contains(e.target) && !filterBtn.contains(e.target)) {
            filterDropdown.classList.remove('show');
        }
    });

    document.querySelectorAll('.filter-dropdown-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.filter-dropdown-item').forEach(i => i.classList.remove('active'));
            
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            
            const correspondingBtn = document.querySelector(`.filter-btn[data-filter="${currentFilter}"]`);
            if (correspondingBtn) {
                correspondingBtn.classList.add('active');
            }
            
            filterTasks(currentFilter);
            document.getElementById('filterDropdown').classList.remove('show');
        });
    });
}

function handleAddTask(e) {
    e.preventDefault();
    
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDescription').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const category = document.getElementById('taskCategory').value.trim();
    const dueDate = document.getElementById('taskDueDate').value;
    const important = document.getElementById('taskImportant').checked;
    
    if (!title) {
        showToast('Task title is required!', 'Please enter a title for your task.', 'error');
        document.getElementById('taskTitle').focus();
        return;
    }
    
    const newTask = {
        id: Date.now(),
        title,
        description,
        priority,
        category: category || 'General',
        dueDate: dueDate || null,
        important,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null
    };
    
    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    updateStats();
    
    document.getElementById('taskForm').reset();
    document.querySelector('.task-form .priority-option.priority-medium').click();
    
    showToast('Task added successfully!', `"${title}" has been added to your list.`, 'success');
    
    document.getElementById('taskList').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

function handleEditTask(e) {
    e.preventDefault();
    
    if (!currentEditTaskId) return;
    
    const title = document.getElementById('editTaskTitle').value.trim();
    const description = document.getElementById('editTaskDescription').value.trim();
    const priority = document.getElementById('editTaskPriority').value;
    const category = document.getElementById('editTaskCategory').value.trim();
    const dueDate = document.getElementById('editTaskDueDate').value;
    const important = document.getElementById('editTaskImportant').checked;
    const completed = document.getElementById('editTaskCompleted').checked;
    
    if (!title) {
        showToast('Task title is required!', 'Please enter a title for your task.', 'error');
        return;
    }
    
    const taskIndex = tasks.findIndex(task => task.id === currentEditTaskId);
    if (taskIndex === -1) return;
    
    tasks[taskIndex] = {
        ...tasks[taskIndex],
        title,
        description,
        priority,
        category: category || 'General',
        dueDate: dueDate || null,
        important,
        completed,
        completedAt: completed && !tasks[taskIndex].completed ? new Date().toISOString() : 
                     !completed ? null : tasks[taskIndex].completedAt
    };
    
    saveTasks();
    renderTasks();
    updateStats();
    closeEditModal();
    
    showToast('Task updated successfully!', `"${title}" has been updated.`, 'success');
}

function deleteTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    currentDeleteTaskId = id;
    document.getElementById('deleteConfirmMessage').textContent = `Are you sure you want to delete "${task.title}"?`;
    document.getElementById('deleteConfirmModal').classList.add('active');
}

function confirmDeleteTask() {
    if (!currentDeleteTaskId) return;
    
    if (currentDeleteTaskId === 'all') {
        const allTasks = [...tasks];
        allTasks.forEach(task => {
            const deletedTask = {
                ...task,
                deletedAt: new Date().toISOString(),
                permanentDeleteAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            };
            deletedTasks.push(deletedTask);
        });
        tasks = [];
        showToast('All tasks deleted!', `${allTasks.length} tasks moved to deleted.`, 'info');
    } else if (currentDeleteTaskId === 'selected') {
        const tasksToDelete = tasks.filter(t => selectedTaskIds.includes(t.id));
        tasksToDelete.forEach(task => {
            const deletedTask = {
                ...task,
                deletedAt: new Date().toISOString(),
                permanentDeleteAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            };
            deletedTasks.push(deletedTask);
        });
        tasks = tasks.filter(t => !selectedTaskIds.includes(t.id));
        showToast('Selected tasks deleted!', `${selectedTaskIds.length} tasks moved to deleted.`, 'info');
        selectedTaskIds = [];
    } else {
        const task = tasks.find(t => t.id === currentDeleteTaskId);
        const deletedTask = {
            ...task,
            deletedAt: new Date().toISOString(),
            permanentDeleteAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
        deletedTasks.push(deletedTask);
        tasks = tasks.filter(t => t.id !== currentDeleteTaskId);
        showToast('Task deleted!', `"${task.title}" has been removed.`, 'info');
    }
    
    saveTasks();
    saveDeletedTasks();
    renderTasks();
    updateStats();
    closeDeleteModal();
}

function closeDeleteModal() {
    document.getElementById('deleteConfirmModal').classList.remove('active');
    currentDeleteTaskId = null;
}

function toggleTaskCompletion(id) {
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) return;
    
    const task = tasks[taskIndex];
    if (isTaskExpired(task) && !task.completed) {
        return;
    }
    
    tasks[taskIndex].completed = !tasks[taskIndex].completed;
    tasks[taskIndex].completedAt = tasks[taskIndex].completed ? new Date().toISOString() : null;
    
    saveTasks();
    renderTasks();
    updateStats();
    
    const action = tasks[taskIndex].completed ? 'completed' : 'marked as pending';
    showToast(`Task ${action}!`, `"${tasks[taskIndex].title}" has been ${action}.`, 'success');
}

function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    if (isTaskExpired(task) && !task.completed) {
        showToast('Cannot edit expired task!', 'This task has expired and cannot be edited.', 'warning');
        return;
    }
    
    currentEditTaskId = id;
    
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDescription').value = task.description || '';
    document.getElementById('editTaskCategory').value = task.category;
    document.getElementById('editTaskDueDate').value = task.dueDate || '';
    document.getElementById('editTaskImportant').checked = task.important;
    document.getElementById('editTaskCompleted').checked = task.completed;
    
    document.querySelectorAll('#editTaskForm .priority-option').forEach(opt => {
        opt.classList.remove('active');
        if (opt.dataset.priority === task.priority) {
            opt.classList.add('active');
        }
    });
    document.getElementById('editTaskPriority').value = task.priority;
    
    document.getElementById('editModal').classList.add('active');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    currentEditTaskId = null;
}

function openSelectTaskModal() {
    selectedTaskIds = [];
    renderSelectTaskList();
    document.getElementById('selectTaskModal').classList.add('active');
}

function closeSelectTaskModal() {
    document.getElementById('selectTaskModal').classList.remove('active');
    selectedTaskIds = [];
}

function renderSelectTaskList() {
    const selectTaskList = document.getElementById('selectTaskList');
    
    if (tasks.length === 0) {
        selectTaskList.innerHTML = `
            <div class="no-tasks">
                <i class="fas fa-tasks"></i>
                <h3>No tasks available</h3>
                <p>Add some tasks first!</p>
            </div>
        `;
        return;
    }
    
    selectTaskList.innerHTML = tasks.map(task => `
        <div class="select-task-item" data-id="${task.id}">
            <div class="select-checkbox ${selectedTaskIds.includes(task.id) ? 'selected' : ''}" onclick="toggleSelectTask(${task.id})">
                ${selectedTaskIds.includes(task.id) ? '<i class="fas fa-check"></i>' : ''}
            </div>
            <div class="select-task-content">
                <div class="select-task-title">${task.title}</div>
                ${task.description ? `<div class="select-task-desc">${task.description}</div>` : ''}
                <div class="select-task-meta">
                    <span class="select-priority ${task.priority}-badge">${task.priority}</span>
                    <span class="select-category"><i class="fas fa-tag"></i> ${task.category}</span>
                </div>
            </div>
        </div>
    `).join('');
}

function toggleSelectTask(id) {
    if (selectedTaskIds.includes(id)) {
        selectedTaskIds = selectedTaskIds.filter(taskId => taskId !== id);
    } else {
        selectedTaskIds.push(id);
    }
    renderSelectTaskList();
}

function deleteSelectedTasks() {
    if (selectedTaskIds.length === 0) {
        showToast('No tasks selected!', 'Please select tasks to delete.', 'warning');
        return;
    }
    
    currentDeleteTaskId = 'selected';
    document.getElementById('deleteConfirmMessage').textContent = `Are you sure you want to delete ${selectedTaskIds.length} selected task(s)?`;
    document.getElementById('deleteConfirmModal').classList.add('active');
    closeSelectTaskModal();
}

function openRestoreModal() {
    selectedDeletedTaskIds = [];
    updateRestoreModalButtons();
    renderRestoreTaskList();
    document.getElementById('restoreModal').classList.add('active');
}

function closeRestoreModal() {
    document.getElementById('restoreModal').classList.remove('active');
    selectedDeletedTaskIds = [];
    updateRestoreModalButtons();
}

function updateRestoreModalButtons() {
    const closeBtn = document.querySelector('.restore-close-btn');
    const restoreBtn = document.getElementById('restoreSelectedBtn');
    const deleteBtn = document.getElementById('permanentDeleteBtn');
    
    if (selectedDeletedTaskIds.length > 0) {
        closeBtn.style.display = 'none';
        restoreBtn.style.display = 'flex';
        deleteBtn.style.display = 'flex';
    } else {
        closeBtn.style.display = 'flex';
        restoreBtn.style.display = 'none';
        deleteBtn.style.display = 'none';
    }
}

function renderRestoreTaskList() {
    const restoreTaskList = document.getElementById('restoreTaskList');
    
    if (deletedTasks.length === 0) {
        restoreTaskList.innerHTML = `
            <div class="no-tasks">
                <i class="fas fa-trash"></i>
                <h3>No deleted tasks</h3>
                <p>Deleted tasks will appear here</p>
            </div>
        `;
        return;
    }
    
    restoreTaskList.innerHTML = deletedTasks.map(task => {
        const isExpired = isTaskExpired(task);
        return `
            <div class="restore-task-item ${isExpired ? 'expired-task' : ''}" data-id="${task.id}">
                <div class="restore-checkbox ${selectedDeletedTaskIds.includes(task.id) ? 'selected' : ''}" onclick="toggleRestoreTask(${task.id})">
                    ${selectedDeletedTaskIds.includes(task.id) ? '<i class="fas fa-check"></i>' : ''}
                </div>
                <div class="restore-task-content">
                    <div class="restore-task-title">
                        ${task.title}
                        ${isExpired ? '<span class="expired-badge">Expired Task</span>' : ''}
                    </div>
                    ${task.description ? `<div class="restore-task-desc">${task.description}</div>` : ''}
                    <div class="restore-task-meta">
                        <span class="restore-priority ${task.priority}-badge">${task.priority}</span>
                        <span class="restore-category"><i class="fas fa-tag"></i> ${task.category}</span>
                    </div>
                    <div class="restore-task-timer">
                        <i class="fas fa-clock"></i> Permanently delete: ${formatPermanentDeleteDate(task.permanentDeleteAt)}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function toggleRestoreTask(id) {
    if (selectedDeletedTaskIds.includes(id)) {
        selectedDeletedTaskIds = selectedDeletedTaskIds.filter(taskId => taskId !== id);
    } else {
        selectedDeletedTaskIds.push(id);
    }
    updateRestoreModalButtons();
    renderRestoreTaskList();
}

function restoreSelectedTasks() {
    if (selectedDeletedTaskIds.length === 0) {
        showToast('No tasks selected!', 'Please select tasks to restore.', 'warning');
        return;
    }
    
    const tasksToRestore = deletedTasks.filter(task => selectedDeletedTaskIds.includes(task.id));
    
    tasksToRestore.forEach(task => {
        const restoredTask = {
            id: task.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            category: task.category,
            dueDate: task.dueDate,
            important: task.important,
            completed: task.completed,
            createdAt: task.createdAt,
            completedAt: task.completedAt
        };
        tasks.unshift(restoredTask);
    });
    
    deletedTasks = deletedTasks.filter(task => !selectedDeletedTaskIds.includes(task.id));
    
    saveTasks();
    saveDeletedTasks();
    renderTasks();
    updateStats();
    closeRestoreModal();
    
    showToast('Tasks restored!', `${selectedDeletedTaskIds.length} task(s) have been restored.`, 'success');
}

function permanentDeleteSelectedTasks() {
    if (selectedDeletedTaskIds.length === 0) {
        showToast('No tasks selected!', 'Please select tasks to delete permanently.', 'warning');
        return;
    }
    
    deletedTasks = deletedTasks.filter(task => !selectedDeletedTaskIds.includes(task.id));
    
    saveDeletedTasks();
    closeRestoreModal();
    
    showToast('Tasks permanently deleted!', `${selectedDeletedTaskIds.length} task(s) have been permanently deleted.`, 'info');
}

function isTaskExpired(task) {
    if (!task.dueDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return task.dueDate < today;
}

function formatPermanentDeleteDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        day: 'numeric',
        month: 'short', 
        year: 'numeric'
    });
}

function startDeleteCountdown() {
    setInterval(() => {
        const now = Date.now();
        const previousCount = deletedTasks.length;
        deletedTasks = deletedTasks.filter(task => {
            const deleteTime = new Date(task.permanentDeleteAt).getTime();
            return deleteTime > now;
        });
        if (deletedTasks.length !== previousCount) {
            saveDeletedTasks();
        }
    }, 60000);
}

function renderTasks() {
    const taskList = document.getElementById('taskList');
    const filteredTasks = getFilteredTasks(currentFilter);
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="no-tasks">
                <i class="fas fa-tasks"></i>
                <h3>No tasks found</h3>
                <p>${currentFilter === 'all' ? 'Add your first task using the form!' : 'No tasks match the current filter.'}</p>
            </div>
        `;
        return;
    }
    
    taskList.innerHTML = filteredTasks.map(task => {
        const isExpired = isTaskExpired(task) && !task.completed;
        return `
            <div class="task-item ${task.completed ? 'completed' : ''} ${isExpired ? 'expired' : ''} priority-${task.priority}" data-id="${task.id}">
                <div class="task-header">
                    <div class="task-title">
                        <div class="task-checkbox ${task.completed ? 'checked' : ''} ${isExpired ? 'disabled' : ''}" onclick="${isExpired ? '' : `toggleTaskCompletion(${task.id})`}"></div>
                        ${task.title}
                        ${task.important ? '<i class="fas fa-star" style="color: #FF9800;"></i>' : ''}
                    </div>
                    <div class="task-priority ${task.priority}-badge">
                        ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                    </div>
                </div>
                
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                
                <div class="category-tag">
                    <i class="fas fa-tag"></i> ${task.category}
                </div>
                
                <div class="task-footer">
                    <div class="task-date">
                        <i class="fas fa-calendar"></i>
                        ${task.dueDate ? `Due: ${formatDate(task.dueDate)}` : 'No due date'}
                        ${isExpired ? '<span class="expired-label">Expired Task</span>' : ''}
                    </div>
                    
                    <div class="task-actions">
                        ${!isExpired ? `
                        <button class="task-action-btn edit-btn" onclick="openEditModal(${task.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        ` : ''}
                        <button class="task-action-btn delete-btn" onclick="deleteTask(${task.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function filterTasks(filter = 'all', searchTerm = '') {
    currentFilter = filter;
    const filteredTasks = getFilteredTasks(filter, searchTerm);
    const taskList = document.getElementById('taskList');
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = `
            <div class="no-tasks">
                <i class="fas fa-search"></i>
                <h3>No tasks found</h3>
                <p>${searchTerm ? 'No tasks match your search.' : 'No tasks match the current filter.'}</p>
            </div>
        `;
        return;
    }
    
    taskList.innerHTML = filteredTasks.map(task => {
        const isExpired = isTaskExpired(task) && !task.completed;
        return `
            <div class="task-item ${task.completed ? 'completed' : ''} ${isExpired ? 'expired' : ''} priority-${task.priority}" data-id="${task.id}">
                <div class="task-header">
                    <div class="task-title">
                        <div class="task-checkbox ${task.completed ? 'checked' : ''} ${isExpired ? 'disabled' : ''}" onclick="${isExpired ? '' : `toggleTaskCompletion(${task.id})`}"></div>
                        ${highlightSearchTerm(task.title, searchTerm)}
                        ${task.important ? '<i class="fas fa-star" style="color: #FF9800;"></i>' : ''}
                    </div>
                    <div class="task-priority ${task.priority}-badge">
                        ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                    </div>
                </div>
                
                ${task.description ? `<div class="task-description">${highlightSearchTerm(task.description, searchTerm)}</div>` : ''}
                
                <div class="category-tag">
                    <i class="fas fa-tag"></i> ${task.category}
                </div>
                
                <div class="task-footer">
                    <div class="task-date">
                        <i class="fas fa-calendar"></i>
                        ${task.dueDate ? `Due: ${formatDate(task.dueDate)}` : 'No due date'}
                        ${isExpired ? '<span class="expired-label">Expired Task</span>' : ''}
                    </div>
                    
                    <div class="task-actions">
                        ${!isExpired ? `
                        <button class="task-action-btn edit-btn" onclick="openEditModal(${task.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        ` : ''}
                        <button class="task-action-btn delete-btn" onclick="deleteTask(${task.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getFilteredTasks(filter = 'all', searchTerm = '') {
    let filtered = tasks;
    
    if (filter === 'pending') {
        filtered = filtered.filter(task => !task.completed);
    } else if (filter === 'completed') {
        filtered = filtered.filter(task => task.completed);
    } else if (filter === 'high') {
        filtered = filtered.filter(task => task.priority === 'high');
    } else if (filter === 'today') {
        const today = new Date().toISOString().split('T')[0];
        filtered = filtered.filter(task => task.dueDate === today);
    } else if (filter === 'expired') {
        filtered = filtered.filter(task => isTaskExpired(task) && !task.completed);
    }
    
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(task => 
            task.title.toLowerCase().includes(term) || 
            task.description.toLowerCase().includes(term) ||
            task.category.toLowerCase().includes(term)
        );
    }
    
    return filtered;
}

function highlightSearchTerm(text, term) {
    if (!term) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<span class="gradient-text">$1</span>');
}

function updateStats() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const highPriorityTasks = tasks.filter(task => task.priority === 'high').length;
    
    document.getElementById('totalTasks').textContent = totalTasks;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('pendingTasks').textContent = pendingTasks;
    document.getElementById('highPriorityTasks').textContent = highPriorityTasks;
    document.getElementById('taskCount').textContent = totalTasks;
    document.getElementById('footerTaskCount').textContent = totalTasks;
    
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    document.getElementById('taskProgress').style.width = `${progress}%`;
    document.getElementById('progressText').textContent = `${progress}% Complete`;
    
    const progressFill = document.getElementById('taskProgress');
    if (progress < 30) {
        progressFill.style.background = 'linear-gradient(90deg, #F44336, #FF9800)';
    } else if (progress < 70) {
        progressFill.style.background = 'linear-gradient(90deg, #FF9800, #FFEB3B)';
    } else {
        progressFill.style.background = 'linear-gradient(90deg, #4CAF50, #8BC34A)';
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
        return 'Tomorrow';
    }
    
    return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
    });
}

function showToast(title, message, type = 'info') {
    toastCounter++;
    const toastSound = new Audio('assets/notification.mp3');
    toastSound.volume = 0.6;

    try {
    toastSound.currentTime = 0;
    toastSound.play();
   } catch (e) {}

    const toastId = `toast-${toastCounter}`;
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        info: 'fas fa-info-circle',
        warning: 'fas fa-exclamation-triangle'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.id = toastId;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="${icons[type]}"></i>
        </div>
        <div class="toast-content">
            <h4>${title}</h4>
            <p>${message}</p>
        </div>
        <div class="toast-close" onclick="removeToast('${toastId}')">
            <i class="fas fa-times"></i>
        </div>
    `;
    
    document.getElementById('toastContainer').appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        removeToast(toastId);
    }, 5000);
}

function removeToast(id) {
    const toast = document.getElementById(id);
    if (!toast) return;
    
    toast.classList.remove('show');
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 500);
}

function saveTasks() {
    localStorage.setItem('nexusTasks', JSON.stringify(tasks));
}

function saveDeletedTasks() {
    localStorage.setItem('nexusDeletedTasks', JSON.stringify(deletedTasks));
}

function loadTasks() {
    const savedTasks = localStorage.getItem('nexusTasks');
    const savedDeletedTasks = localStorage.getItem('nexusDeletedTasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        renderTasks();
    }
    if (savedDeletedTasks) {
        deletedTasks = JSON.parse(savedDeletedTasks);
    }
}

function exportTasks() {
    const visibleTasks = getFilteredTasks(currentFilter);
    
    if (visibleTasks.length === 0) {
        showToast('No tasks to export!', 'Add some tasks first.', 'warning');
        return;
    }
    
    const dataStr = JSON.stringify(visibleTasks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `nexus-tasks-${currentFilter}-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showToast('Tasks exported!', `${visibleTasks.length} tasks downloaded as JSON.`, 'success');
}

// window.addDemoTasks = function() {
//     const demoTasks = [
//         {
//             id: Date.now() - 1000,
//             title: 'Complete Project Proposal',
//             description: 'Finish writing the project proposal document and send to client for review.',
//             priority: 'high',
//             category: 'Work',
//             dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
//             important: true,
//             completed: false,
//             createdAt: new Date(Date.now() - 86400000).toISOString(),
//             completedAt: null
//         },
//         {
//             id: Date.now() - 2000,
//             title: 'Buy Groceries',
//             description: 'Milk, eggs, bread, fruits, and vegetables from the supermarket.',
//             priority: 'medium',
//             category: 'Personal',
//             dueDate: new Date().toISOString().split('T')[0],
//             important: false,
//             completed: true,
//             createdAt: new Date(Date.now() - 172800000).toISOString(),
//             completedAt: new Date(Date.now() - 86400000).toISOString()
//         },
//         {
//             id: Date.now() - 3000,
//             title: 'Schedule Dentist Appointment',
//             description: 'Call Dr. Smith\'s office to schedule routine dental checkup.',
//             priority: 'low',
//             category: 'Health',
//             dueDate: new Date(Date.now() + 259200000).toISOString().split('T')[0],
//             important: false,
//             completed: false,
//             createdAt: new Date(Date.now() - 259200000).toISOString(),
//             completedAt: null
//         },
//         {
//             id: Date.now() - 4000,
//             title: 'Prepare Presentation Slides',
//             description: 'Create slides for the quarterly business review meeting next week.',
//             priority: 'high',
//             category: 'Work',
//             dueDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
//             important: true,
//             completed: false,
//             createdAt: new Date(Date.now() - 345600000).toISOString(),
//             completedAt: null
//         },
//         {
//             id: Date.now() - 5000,
//             title: 'Read Book',
//             description: 'Finish reading "Atomic Habits" by James Clear.',
//             priority: 'low',
//             category: 'Learning',
//             dueDate: null,
//             important: false,
//             completed: true,
//             createdAt: new Date(Date.now() - 432000000).toISOString(),
//             completedAt: new Date(Date.now() - 86400000).toISOString()
//         }
//     ];
    
//     if (tasks.length === 0) {
//         tasks = demoTasks;
//         saveTasks();
//         renderTasks();
//         updateStats();
//         showToast('Demo tasks added!', 'Sample tasks have been loaded to help you explore the app.', 'success');
//     } else {
//         showToast('Tasks already exist!', 'Demo tasks were not added because you already have tasks.', 'info');
//     }
// }