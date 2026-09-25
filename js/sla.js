// Target time to resolve a ticket, in hours, for each priority
const SLA_HOURS = { Urgent: 4, High: 8, Medium: 24, Low: 72 };

const PRIORITY_BADGE = {
  Urgent: "border border-danger text-danger",
  High: "border border-warning text-warning-emphasis",
  Medium: "border border-info text-info-emphasis",
  Low: "border border-secondary text-secondary",
};

const SLA_BADGE = {
  overdue: "text-bg-danger",
  soon: "text-bg-warning",
  ok: "text-bg-success",
};

function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

// Returns null for closed tickets, otherwise { level, label }
function getSla(ticket) {
  if (ticket.status === "Closed") return null;

  const targetMs = (SLA_HOURS[ticket.priority] || 24) * 60 * 60 * 1000;
  const elapsedMs = Date.now() - new Date(ticket.created_at).getTime();
  const remainingMs = targetMs - elapsedMs;

  if (remainingMs < 0) {
    return {
      level: "overdue",
      label: `Overdue by ${formatDuration(-remainingMs)}`,
    };
  }
  // "due soon" = less than 25% of the target time left
  if (remainingMs < targetMs * 0.25) {
    return { level: "soon", label: `Due in ${formatDuration(remainingMs)}` };
  }
  return { level: "ok", label: `${formatDuration(remainingMs)} left` };
}

function makeSlaBadge(sla) {
  const span = document.createElement("span");
  span.className = `badge ${SLA_BADGE[sla.level]}`;
  span.textContent = sla.label;
  return span;
}
