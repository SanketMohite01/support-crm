const params = new URLSearchParams(window.location.search);
const ticketId = params.get("id");

const alertBox = document.getElementById("alert");
const view = document.getElementById("ticket-view");
const statusSelect = document.getElementById("status-select");
const statusBtn = document.getElementById("status-btn");
const noteForm = document.getElementById("note-form");
const noteText = document.getElementById("note-text");
const noteBtn = document.getElementById("note-btn");
const notesList = document.getElementById("notes-list");

const STATUS_BADGE = {
  Open: "text-bg-primary",
  "In Progress": "text-bg-warning",
  Closed: "text-bg-secondary",
};

function formatDate(iso) {
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function showAlert(type, message) {
  alertBox.innerHTML = "";
  const div = document.createElement("div");
  div.className = `alert alert-${type}`;
  div.textContent = message;
  alertBox.appendChild(div);
}

function setText(id, value) {
  document.getElementById(id).textContent = value;
}

function renderTicket(t) {
  setText("t-id", t.ticket_id);
  setText("t-subject", t.subject);
  setText("t-name", t.customer_name);
  setText("t-email", t.customer_email);
  setText("t-created", formatDate(t.created_at));
  setText("t-updated", formatDate(t.updated_at));
  setText("t-description", t.description);

  const badge = document.getElementById("t-badge");
  badge.className = `badge ${STATUS_BADGE[t.status] || "text-bg-light"}`;
  badge.textContent = t.status;

  statusSelect.value = t.status;
  view.classList.remove("d-none");
}

function renderNotes(notes) {
  notesList.innerHTML = "";

  if (notes.length === 0) {
    const p = document.createElement("p");
    p.className = "text-muted small mb-0";
    p.textContent = "No notes yet.";
    notesList.appendChild(p);
    return;
  }

  notes.forEach((n) => {
    const box = document.createElement("div");
    box.className = "border rounded p-2 mb-2 bg-light";

    const text = document.createElement("div");
    text.style.whiteSpace = "pre-wrap";
    text.textContent = n.note_text;

    const time = document.createElement("div");
    time.className = "text-muted small mt-1";
    time.textContent = formatDate(n.created_at);

    box.append(text, time);
    notesList.appendChild(box);
  });
}

async function loadTicket() {
  if (!ticketId) {
    showAlert(
      "warning",
      "No ticket ID in the address. Go back and pick a ticket.",
    );
    return;
  }

  const { data, error } = await db
    .from("tickets")
    .select("*")
    .eq("ticket_id", ticketId)
    .maybeSingle(); // returns null (not an error) when nothing matches

  if (error) {
    console.error(error);
    showAlert("danger", `Could not load ticket: ${error.message}`);
    return;
  }
  if (!data) {
    showAlert("warning", `Ticket ${ticketId} was not found.`);
    return;
  }

  renderTicket(data);
  loadNotes();
}

async function loadNotes() {
  const { data, error } = await db
    .from("notes")
    .select("note_text, created_at")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    showAlert("danger", `Could not load notes: ${error.message}`);
    return;
  }
  renderNotes(data);
}

statusBtn.addEventListener("click", async () => {
  statusBtn.disabled = true;
  statusBtn.textContent = "Saving...";
  alertBox.innerHTML = "";

  try {
    const { data, error } = await db
      .from("tickets")
      .update({
        status: statusSelect.value,
        updated_at: new Date().toISOString(), // Postgres does not do this automatically
      })
      .eq("ticket_id", ticketId)
      .select()
      .single();

    if (error) throw error;

    renderTicket(data);
    showAlert("success", `Status changed to "${data.status}".`);
  } catch (err) {
    console.error(err);
    showAlert("danger", err.message || "Could not update status");
  } finally {
    statusBtn.disabled = false;
    statusBtn.textContent = "Save status";
  }
});

noteForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = noteText.value.trim();
  if (!text) return;

  noteBtn.disabled = true;
  noteBtn.textContent = "Adding...";
  alertBox.innerHTML = "";

  try {
    const { error } = await db
      .from("notes")
      .insert({ ticket_id: ticketId, note_text: text });
    if (error) throw error;

    // adding a note counts as activity, so bump updated_at
    await db
      .from("tickets")
      .update({ updated_at: new Date().toISOString() })
      .eq("ticket_id", ticketId);

    noteText.value = "";
    loadNotes();
  } catch (err) {
    console.error(err);
    showAlert("danger", err.message || "Could not add note");
  } finally {
    noteBtn.disabled = false;
    noteBtn.textContent = "Add note";
  }
});

loadTicket();
