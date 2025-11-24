let tasks = [];

document.addEventListener("DOMContentLoaded", () => {
    loadTasks();

    const input = document.getElementById("taskInput");
    input.addEventListener("keydown", async (e) => {
        if (e.key === "Enter") {
            const title = input.value.trim();
            if (!title) return;
            await frappe.call({ method: "task_organiser.api.add_task", args: { title } });
            input.value = "";
            await loadTasks();
        }
    });

    document.getElementById("taskList").addEventListener("click", async (e) => {
        const li = e.target.closest("li");
        if (!li) return;
        const idx = li.dataset.idx;
        const t = tasks[idx];
        if (e.target.classList.contains("timer-btn")) {
            await frappe.call({ method: "task_organiser.api.toggle_timer", args: { task_name: t.name } });
            await loadTasks();
        }
        if (e.target.classList.contains("complete-btn")) {
            const method = t.is_completed ? "task_organiser.api.mark_uncomplete" : "task_organiser.api.mark_complete";
            await frappe.call({ method, args: { task_name: t.name } });
            await loadTasks();
        }
    });
});

async function loadTasks() {
    const resp = await frappe.call({ method: "task_organiser.api.get_tasks" });
    tasks = resp.message || [];
    renderTasks();
}

function renderTasks() {
    const list = document.getElementById("taskList");
    list.innerHTML = "";
    if (!tasks.length) {
        list.innerHTML = `<li style="color:#999;text-align:center;">No tasks yet</li>`;
        return;
    }
    tasks.forEach((t, idx) => {
        let running = t.is_running === 1;
        let completed = t.is_completed === 1;
        const li = document.createElement("li");
        li.dataset.idx = idx;
        li.style = "padding:12px; margin-bottom:10px; background:#fafafa; border-radius:6px; border:1px solid #eee; display:flex; justify-content:space-between; align-items:center;" +
            (completed ? "opacity:0.5;text-decoration:line-through;" : "");
        li.innerHTML = `
            <span>${t.title}</span>
            <span>
                <span class="timer" style="margin-right:12px;">${formatTime(getLiveTime(t))}</span>
                <button class="timer-btn" style="margin-right:7px;">${running ? "⏸" : "▶️"}</button>
                <button class="complete-btn">${completed ? "↩️" : "✔️"}</button>
            </span>
        `;
        list.appendChild(li);
    });
}

setInterval(() => {
    document.querySelectorAll("#taskList .timer").forEach((timerEl, i) => {
        const t = tasks[i];
        if (!t) return;
        timerEl.textContent = formatTime(getLiveTime(t));
    });
}, 1000);

function getLiveTime(t) {
    let extra = 0;
    if (t.is_running && t.last_started_at) {
        extra = Math.floor((Date.now() - new Date(t.last_started_at).getTime()) / 1000);
    }
    return Number(t.time_spent || 0) + extra;
}

function formatTime(sec) {
    sec = sec || 0;
    const h = String(Math.floor(sec / 3600)).padStart(2, "0");
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
}
