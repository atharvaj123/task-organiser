import frappe
from frappe.utils import now_datetime

@frappe.whitelist(allow_guest=True)
def get_tasks():
    tasks = frappe.get_all(
        "Organiser Task",
        fields=["name", "title", "time_spent", "is_running", "is_completed", "last_started_at"],
        order_by="modified desc"
    )
    result = []
    for t in tasks:
        ts = t.time_spent or 0
        try:
            ts = int(ts)
        except:
            ts = 0
        result.append({
            "name": t.name,
            "title": t.title,
            "time_spent": ts,
            "is_running": int(t.is_running) if t.is_running else 0,
            "is_completed": int(t.is_completed) if t.is_completed else 0,
            "last_started_at": t.last_started_at.isoformat() if t.last_started_at else None
        })
    return result

@frappe.whitelist(allow_guest=True)
def add_task(title):
    doc = frappe.get_doc({
        "doctype": "Organiser Task",
        "title": title,
        "time_spent": 0,
        "is_running": 0,
        "is_completed": 0,
        "last_started_at": None
    })
    doc.insert(ignore_permissions=True)
    frappe.db.commit()
    return {"name": doc.name}

@frappe.whitelist(allow_guest=True)
def toggle_timer(task_name):
    task = frappe.get_doc("Organiser Task", task_name)
    now = now_datetime()
    if task.is_running:
        elapsed = (now - task.last_started_at).total_seconds() if task.last_started_at else 0
        task.time_spent = int(task.time_spent or 0) + int(elapsed)
        task.is_running = 0
        task.last_started_at = None
    else:
        task.is_running = 1
        task.last_started_at = now
    task.save(ignore_permissions=True)
    frappe.db.commit()
    return {
        "name": task.name,
        "is_running": int(task.is_running),
        "time_spent": int(task.time_spent),
        "last_started_at": task.last_started_at.isoformat() if task.last_started_at else None,
        "is_completed": int(task.is_completed)
    }

@frappe.whitelist(allow_guest=True)
def mark_complete(task_name):
    task = frappe.get_doc("Organiser Task", task_name)
    # Stop timer if running
    if task.is_running and task.last_started_at:
        elapsed = (now_datetime() - task.last_started_at).total_seconds()
        task.time_spent = int(task.time_spent or 0) + int(elapsed)
        task.is_running = 0
        task.last_started_at = None
    task.is_completed = 1
    task.save(ignore_permissions=True)
    frappe.db.commit()
    return {"status": "completed", "name": task.name}

@frappe.whitelist(allow_guest=True)
def mark_uncomplete(task_name):
    task = frappe.get_doc("Organiser Task", task_name)
    task.is_completed = 0
    task.save(ignore_permissions=True)
    frappe.db.commit()
    return {"status": "uncompleted", "name": task.name}
