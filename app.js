document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('task-form');
    const taskList = document.getElementById('task-list');
    const filterTasks = document.getElementById('filter-tasks');

    // Load tasks from localStorage or initialize empty array
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    // Save tasks array to localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // Render tasks based on current filter and sort by due date ascending
    function renderTasks() {
        taskList.innerHTML = '';

        let filteredTasks = tasks;
        const filter = filterTasks.value;
        if (filter === 'complete') {
            filteredTasks = tasks.filter(task => task.completed);
        } else if (filter === 'incomplete') {
            filteredTasks = tasks.filter(task => !task.completed);
        }
        // Sort filtered tasks by due date ascending (earliest due date first)
        filteredTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        filteredTasks.forEach((task, index) => {
            const li = document.createElement('li');
            li.className = 'task-item';
            if (task.completed) {
                li.classList.add('task-completed');
            }

            const header = document.createElement('div');
            header.className = 'task-header';

            const title = document.createElement('span');
            title.className = 'task-title';
            title.textContent = task.title;

            const dueDate = document.createElement('span');
            dueDate.className = 'task-due-date';
            const dateObj = new Date(task.dueDate);
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const year = dateObj.getFullYear();
            dueDate.textContent = `${day}-${month}-${year}`;

            header.appendChild(title);
            header.appendChild(dueDate);

            const description = document.createElement('p');
            description.className = 'task-description';
            description.textContent = task.description;

            const actions = document.createElement('div');
            actions.className = 'task-actions';

            const completeBtn = document.createElement('button');
            completeBtn.className = 'complete-btn';
            completeBtn.textContent = task.completed ? 'Mark Incomplete' : 'Mark Complete';
            completeBtn.addEventListener('click', () => {
                tasks[index].completed = !tasks[index].completed;
                saveTasks();
                renderTasks();
            });

            const editBtn = document.createElement('button');
            editBtn.textContent = 'Edit';
            editBtn.addEventListener('click', () => {
                editTask(index);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.textContent = 'Delete';

            deleteBtn.addEventListener('click', () => {
                console.log('Delete button clicked for task index:', index);
                console.log('Showing delete confirmation for index:', index);
                showDeleteConfirm(index);
            });

            // Show delete confirmation box for the selected task
            function showDeleteConfirm(idx) {
                const taskItems = document.querySelectorAll('.task-item');
                taskItems.forEach((item, i) => {
                    const confirmBox = item.querySelector('.delete-confirm');
                    if (i === idx) {
                        confirmBox.style.display = 'flex';
                    } else {
                        confirmBox.style.display = 'none';
                    }
                });
            }

            actions.appendChild(completeBtn);
            actions.appendChild(editBtn);
            actions.appendChild(deleteBtn);

            li.appendChild(header);
            li.appendChild(description);
            li.appendChild(actions);

            // Delete confirmation container
            const deleteConfirm = document.createElement('div');
            deleteConfirm.className = 'delete-confirm';
            deleteConfirm.style.display = 'none';

            const confirmText = document.createElement('span');
            confirmText.textContent = 'Delete this task?';

            const confirmBtn = document.createElement('button');
            confirmBtn.textContent = 'Yes';
            confirmBtn.className = 'confirm-btn';
            confirmBtn.addEventListener('click', () => {
                deleteConfirm.style.display = 'none';
                const taskItems = document.querySelectorAll('.task-item');
                const taskItem = taskItems[index];
                taskItem.classList.add('removing');
                taskItem.addEventListener('animationend', () => {
                    tasks.splice(index, 1);
                    saveTasks();
                    renderTasks();
                }, { once: true });
            });

            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'No';
            cancelBtn.className = 'cancel-btn';
            cancelBtn.addEventListener('click', () => {
                deleteConfirm.style.display = 'none';
            });

            deleteConfirm.appendChild(confirmText);
            deleteConfirm.appendChild(confirmBtn);
            deleteConfirm.appendChild(cancelBtn);

            li.appendChild(deleteConfirm);

            taskList.appendChild(li);
        });
    }

    // Edit task: populate form with task data and remove task from list for replacement
    function editTask(index) {
        const task = tasks[index];
        document.getElementById('title').value = task.title;
        document.getElementById('description').value = task.description;
        document.getElementById('due-date').value = task.dueDate;
        // Remove the task being edited so it can be replaced on submit
        tasks.splice(index, 1);
        saveTasks();
        renderTasks();
    }

    // Variables to manage flash message display timing and state
    let flashTimeout1 = null;
    let flashTimeout2 = null;
    let flashShowing = false;

    // Show reminders for tasks due today or tomorrow, one at a time
    function checkReminders() {
        if (flashShowing) return; // Prevent overlapping flash messages

        const now = new Date();
        now.setHours(0,0,0,0); // normalize to midnight
        const flashMessage = document.getElementById('flash-message');
        const reminders = [];
        tasks.forEach(task => {
            if (!task.completed) {
                const dueDate = new Date(task.dueDate);
                dueDate.setHours(0,0,0,0); // normalize to midnight
                const diffTime = dueDate - now;
                const diffDays = diffTime / (1000 * 60 * 60 * 24);
                if (diffDays >= 0 && diffDays <= 1) {
                    let roundedDiffDays = Math.round(diffDays);
                    let dayText = roundedDiffDays === 0 ? 'today' : 'tomorrow';
                    reminders.push(`Reminder: Task "${task.title}" is due ${dayText}!`);
                }
            }
        });

        let index = 0;
        function showNextReminder() {
            if (index >= reminders.length) {
                flashMessage.style.display = 'none';
                flashShowing = false;
                return;
            }
            flashShowing = true;
            flashMessage.textContent = reminders[index];
            flashMessage.style.display = 'block';
            flashMessage.classList.add('show');
            flashTimeout1 = setTimeout(() => {
                flashMessage.classList.remove('show');
                flashTimeout2 = setTimeout(() => {
                    flashMessage.style.display = 'none';
                    index++;
                    showNextReminder();
                }, 500);
            }, 4000);
        }

        if (reminders.length > 0) {
            showNextReminder();
        }
    }

    // Show a single flash message with animation and timing
    function showFlashMessage(message) {
        if (flashShowing) return; // Prevent overlapping flash messages
        flashShowing = true;

        const flashMessage = document.getElementById('flash-message');
        flashMessage.textContent = message;
        flashMessage.style.display = 'block';
        flashMessage.classList.add('show');

        if (flashTimeout1) clearTimeout(flashTimeout1);
        if (flashTimeout2) clearTimeout(flashTimeout2);

        flashTimeout1 = setTimeout(() => {
            flashMessage.classList.remove('show');
            flashTimeout2 = setTimeout(() => {
                flashMessage.style.display = 'none';
                flashShowing = false;
            }, 500);
        }, 4000);
    }

    // Handle form submission to add a new task
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('title').value.trim();
        const description = document.getElementById('description').value.trim();
        const dueDate = document.getElementById('due-date').value;

        const errorMessage = document.getElementById('error-message');
        errorMessage.textContent = '';

        if (!title || !dueDate) {
            errorMessage.textContent = 'Please provide both a title and due date.';
            return;
        }

        const selectedDate = new Date(dueDate);
        const today = new Date();
        today.setHours(0,0,0,0);

        if (selectedDate < today) {
            errorMessage.textContent = 'Please select a due date that is today or in the future.';
            return;
        }

        tasks.push({
            title,
            description,
            dueDate,
            completed: false
        });

        saveTasks();
        renderTasks();

        // Show flash message only for the newly added task if due today or tomorrow
        // Normalize selectedDate and tomorrow to midnight for accurate comparison
        selectedDate.setHours(0,0,0,0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0,0,0,0);
        if (selectedDate.getTime() === today.getTime()) {
            showFlashMessage(`Due date: today`);
        } else if (selectedDate.getTime() === tomorrow.getTime()) {
            showFlashMessage(`Due date: tomorrow`);
        } else {
            // Do not call checkReminders for other days
            // No flash message shown immediately
        }

        taskForm.reset();
    });

    // Handle filter change to re-render tasks
    filterTasks.addEventListener('change', () => {
        renderTasks();
    });

    // Initial render and reminder check
    renderTasks();
    checkReminders();

    // Periodically check reminders every hour
    setInterval(checkReminders, 60 * 60 * 1000);
});
