const listBody = document.getElementById("ticket-list");
const searchInput = document.getElementById("search");
const statusFilter = document.getElementById("status-filter");
const countText = document.getElementById("count");

let debounceTimer;
let latestRequest = 0;

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

function showMessage(text, className = "text-muted") {
  listBody.innerHTML = "";
  const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.colSpan = 5;
  td.className = `text-center py-4 ${className}`;
  td.textContent = text;
  tr.appendChild(td);
  listBody.appendChild(tr);
}

function renderTickets(tickets) {
  listBody.innerHTML = "";

  tickets.forEach((t) => {
    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";
    tr.addEventListener("click", () => {
      window.location.href = `ticket.html?id=${encodeURIComponent(t.ticket_id)}`;
    });

    const cells = [t.ticket_id, t.customer_name, t.subject];
    cells.forEach((value, i) => {
      const td = document.createElement("td");
      td.textContent = value;
      if (i === 0) td.className = "fw-semibold text-nowrap";
      tr.appendChild(td);
    });

    const statusTd = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = `badge ${STATUS_BADGE[t.status] || "text-bg-light"}`;
    badge.textContent = t.status;
    statusTd.appendChild(badge);
    tr.appendChild(statusTd);

    const dateTd = document.createElement("td");
    dateTd.className = "text-nowrap";
    dateTd.textContent = formatDate(t.created_at);
    tr.appendChild(dateTd);

    listBody.appendChild(tr);
  });
}

async function loadTickets() {
  const thisRequest = ++latestRequest;
  showMessage("Loading tickets...");

  let query = db
    .from("tickets")
    .select("ticket_id, customer_name, subject, status, created_at")
    .order("created_at", { ascending: false });

  const status = statusFilter.value;
  if (status) {
    query = query.eq("status", status);
  }

  // remove characters that have a special meaning inside the .or() filter string
  const term = searchInput.value.trim().replace(/[,()\\]/g, " ");
  if (term) {
    query = query.or(
      `ticket_id.ilike.%${term}%,` +
        `customer_name.ilike.%${term}%,` +
        `customer_email.ilike.%${term}%,` +
        `subject.ilike.%${term}%,` +
        `description.ilike.%${term}%`,
    );
  }

  const { data, error } = await query;

  // ignore this result if a newer search has already started
  if (thisRequest !== latestRequest) return;

  if (error) {
    console.error(error);
    countText.textContent = "";
    showMessage(`Could not load tickets: ${error.message}`, "text-danger");
    return;
  }

  countText.textContent = `${data.length} ticket${data.length === 1 ? "" : "s"}`;

  if (data.length === 0) {
    showMessage("No tickets found.");
    return;
  }
  renderTickets(data);
}

// search as you type, but wait 300 ms after the last keystroke
searchInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(loadTickets, 300);
});

statusFilter.addEventListener("change", loadTickets);

loadTickets();
