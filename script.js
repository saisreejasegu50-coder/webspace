const starterTasks = [
      { id: 1, title: "Plan the week ahead", detail: "Make time for what matters", category: "Personal", done: false },
      { id: 2, title: "Take a proper lunch break", detail: "A little reset goes a long way", category: "Wellbeing", done: false },
      { id: 3, title: "Review today's priorities", detail: "Start with one small win", category: "Focus", done: true }
    ];
    const readStore = (key, fallback) => {
      try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
      } catch (error) {
        console.error(`Could not read ${key} from local storage.`, error);
        return fallback;
      }
    };
    let tasks = readStore("daylight-tasks", starterTasks);
    let expenses = readStore("daylight-expenses", []);
    let notes = readStore("daylight-notes", []);
    let budget = Number(readStore("daylight-budget", 1000)) || 1000;
    let taskFilter = "all";
    const icons = { Food: "🥑", Transport: "🚲", Shopping: "🛍️", Bills: "🧾", Fun: "🎈", Other: "✦" };
    const currency = new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" });
    const save = (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Could not save ${key} to local storage.`, error);
        showToast("Couldn't save changes on this device.");
      }
    };
    const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
    const taskList = document.getElementById("task-list");
    const expenseList = document.getElementById("expense-list");

    function showToast(message) {
      const toast = document.getElementById("toast");
      toast.textContent = message;
      toast.classList.add("show");
      clearTimeout(showToast.timeout);
      showToast.timeout = setTimeout(() => toast.classList.remove("show"), 2400);
    }

    function renderTasks() {
      const visible = tasks.filter(task => taskFilter === "all" || (taskFilter === "done" ? task.done : !task.done));
      document.getElementById("task-total").textContent = tasks.length;
      document.getElementById("task-done").textContent = tasks.filter(task => task.done).length;
      document.getElementById("task-left").textContent = tasks.filter(task => !task.done).length;
      taskList.innerHTML = visible.length ? visible.map(task => `
        <div class="list-item">
          <button class="check ${task.done ? "done" : ""}" data-toggle-task="${task.id}" aria-label="${task.done ? "Mark incomplete" : "Mark complete"}">${task.done ? "✓" : ""}</button>
          <div class="task-copy ${task.done ? "completed" : ""}"><strong>${escapeHTML(task.title)}</strong><small>${escapeHTML(task.detail || "Added just now")}</small></div>
          <span class="tag">${escapeHTML(task.category || "Personal")}</span>
          <button class="delete-button" data-delete-task="${task.id}" aria-label="Delete task">×</button>
        </div>`).join("") : `<div class="empty-state">${tasks.length ? "Nothing in this filter just yet." : "A clear list is a lovely place to start. Add your first task!"}</div>`;
      taskList.querySelectorAll("[data-toggle-task]").forEach(button => button.addEventListener("click", () => {
        tasks = tasks.map(task => task.id === Number(button.dataset.toggleTask) ? { ...task, done: !task.done } : task);
        save("daylight-tasks", tasks);
        renderTasks();
      }));
      taskList.querySelectorAll("[data-delete-task]").forEach(button => button.addEventListener("click", () => {
        tasks = tasks.filter(task => task.id !== Number(button.dataset.deleteTask));
        save("daylight-tasks", tasks);
        renderTasks();
      }));
    }

    function renderExpenses() {
      const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      document.getElementById("spent-total").textContent = currency.format(total);
      document.getElementById("spent-caption").textContent = total ? `${currency.format(Math.max(0, budget - total))} left in your monthly budget.` : "Start logging expenses to see your total.";
      document.getElementById("expense-count").textContent = `${expenses.length} ${expenses.length === 1 ? "entry" : "entries"}`;
      document.getElementById("budget-used").textContent = `${currency.format(total)} spent`;
      document.getElementById("budget-limit").textContent = `of ${currency.format(budget)}`;
      document.getElementById("budget-progress").style.width = `${Math.min(100, budget > 0 ? total / budget * 100 : 100)}%`;
      document.getElementById("budget-progress").style.background = total > budget ? "var(--coral)" : "var(--mint)";
      expenseList.innerHTML = expenses.length ? [...expenses].reverse().map(expense => `
        <div class="transaction">
          <span class="category-icon">${icons[expense.category] || icons.Other}</span>
          <div class="transaction-copy"><strong>${escapeHTML(expense.name)}</strong><small>${escapeHTML(expense.category)} · ${escapeHTML(expense.date)}</small></div>
          <span class="amount">−${currency.format(expense.amount)}</span>
          <button class="delete-button" data-delete-expense="${expense.id}" aria-label="Delete expense">×</button>
        </div>`).join("") : `<div class="empty-state">Your spending will show up here once you add an expense.</div>`;
      expenseList.querySelectorAll("[data-delete-expense]").forEach(button => button.addEventListener("click", () => {
        expenses = expenses.filter(expense => expense.id !== Number(button.dataset.deleteExpense));
        save("daylight-expenses", expenses);
        renderExpenses();
      }));
    }

    function renderNotes() {
      const query = document.getElementById("note-search").value.trim().toLowerCase();
      const visibleNotes = [...notes].reverse().filter(note =>
        `${note.title} ${note.body} ${note.category}`.toLowerCase().includes(query)
      );
      document.getElementById("notes-count").textContent = `${notes.length} ${notes.length === 1 ? "note" : "notes"}`;
      const list = document.getElementById("notes-list");
      list.innerHTML = visibleNotes.length ? visibleNotes.map(note => `
        <article class="note-card">
          <div class="note-card-top">
            <h2>${escapeHTML(note.title)}</h2>
            <div class="note-actions">
              <button type="button" data-edit-note="${note.id}" aria-label="Edit ${escapeHTML(note.title)}">Edit</button>
              <button type="button" data-delete-note="${note.id}" aria-label="Delete ${escapeHTML(note.title)}">Delete</button>
            </div>
          </div>
          <p>${escapeHTML(note.body)}</p>
          <div class="note-meta"><span class="note-badge">${escapeHTML(note.category)}</span><time class="note-date">${escapeHTML(note.updatedAt)}</time></div>
        </article>`).join("") : `<div class="empty-state">${notes.length ? "No notes match your search." : "Your notes will appear here. Save your first idea above!"}</div>`;
      list.querySelectorAll("[data-edit-note]").forEach(button => button.addEventListener("click", () => {
        const note = notes.find(item => item.id === Number(button.dataset.editNote));
        if (!note) return;
        document.getElementById("note-id").value = note.id;
        document.getElementById("note-title").value = note.title;
        document.getElementById("note-body").value = note.body;
        document.getElementById("note-category").value = note.category;
        document.getElementById("save-note").textContent = "Save changes";
        document.getElementById("cancel-note").hidden = false;
        document.getElementById("note-title").focus();
        document.getElementById("note-form").scrollIntoView({ behavior: "smooth", block: "center" });
      }));
      list.querySelectorAll("[data-delete-note]").forEach(button => button.addEventListener("click", () => {
        notes = notes.filter(note => note.id !== Number(button.dataset.deleteNote));
        save("daylight-notes", notes);
        renderNotes();
        showToast("Note deleted.");
      }));
    }

    document.querySelectorAll(".nav-button").forEach(button => button.addEventListener("click", () => {
      document.querySelectorAll(".nav-button").forEach(item => item.classList.toggle("active", item === button));
      document.querySelectorAll(".page").forEach(page => page.classList.toggle("active", page.id === `${button.dataset.page}-page`));
    }));
    document.querySelectorAll(".filter-button").forEach(button => button.addEventListener("click", () => {
      taskFilter = button.dataset.filter;
      document.querySelectorAll(".filter-button").forEach(item => item.classList.toggle("active", item === button));
      renderTasks();
    }));
    const taskDialog = document.getElementById("task-dialog");
    document.getElementById("add-task-button").addEventListener("click", () => {
      document.getElementById("task-form").reset();
      taskDialog.showModal();
      document.getElementById("task-name").focus();
    });
    document.getElementById("cancel-task").addEventListener("click", () => taskDialog.close());
    document.getElementById("task-form").addEventListener("submit", event => {
      event.preventDefault();
      const title = document.getElementById("task-name").value.trim();
      if (!title) { showToast("Add a task name first."); return; }
      tasks.push({ id: Date.now(), title, detail: "Added just now", category: document.getElementById("task-category").value, done: false });
      save("daylight-tasks", tasks);
      taskDialog.close();
      renderTasks();
      showToast("Task added to your day.");
    });
    document.getElementById("note-search").addEventListener("input", renderNotes);
    document.getElementById("cancel-note").addEventListener("click", () => {
      document.getElementById("note-form").reset();
      document.getElementById("note-id").value = "";
      document.getElementById("save-note").textContent = "＋ Save note";
      document.getElementById("cancel-note").hidden = true;
    });
    document.getElementById("note-form").addEventListener("submit", event => {
      event.preventDefault();
      const id = Number(document.getElementById("note-id").value);
      const title = document.getElementById("note-title").value.trim();
      const body = document.getElementById("note-body").value.trim();
      if (!title || !body) { showToast("Add a title and note before saving."); return; }
      const note = {
        id: id || Date.now(),
        title,
        body,
        category: document.getElementById("note-category").value,
        updatedAt: new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date())
      };
      notes = id ? notes.map(item => item.id === id ? note : item) : [...notes, note];
      save("daylight-notes", notes);
      document.getElementById("note-form").reset();
      document.getElementById("note-id").value = "";
      document.getElementById("save-note").textContent = "＋ Save note";
      document.getElementById("cancel-note").hidden = true;
      renderNotes();
      showToast(id ? "Note updated." : "Note saved.");
    });
    document.getElementById("expense-form").addEventListener("submit", event => {
      event.preventDefault();
      const name = document.getElementById("expense-name").value.trim();
      const amount = Number(document.getElementById("expense-amount").value);
      if (!name || !Number.isFinite(amount) || amount <= 0) { showToast("Enter a name and a valid amount."); return; }
      expenses.push({
        id: Date.now(),
        name,
        amount: Math.round(amount * 100) / 100,
        category: document.getElementById("expense-category").value,
        date: new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date())
      });
      save("daylight-expenses", expenses);
      event.currentTarget.reset();
      renderExpenses();
      showToast("Expense saved.");
    });
    document.getElementById("save-budget").addEventListener("click", () => {
      const input = document.getElementById("budget-input");
      if (input.value && Number(input.value) > 0 && Number.isFinite(Number(input.value))) {
        budget = Number(input.value);
        save("daylight-budget", budget);
        input.value = "";
        renderExpenses();
        showToast("Monthly budget updated.");
      } else {
        showToast("Enter a budget greater than zero.");
        input.focus();
      }
    });
    document.getElementById("help-button").addEventListener("click", () => showToast("Choose an app from the sidebar. Your tasks and expenses stay on this device."));
    document.getElementById("today-label").textContent = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date());
    document.getElementById("budget-input").placeholder = String(budget);
    renderTasks();
    renderExpenses();
    renderNotes();
