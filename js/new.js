const form = document.getElementById("ticket-form");
const alertBox = document.getElementById("alert");
const submitBtn = document.getElementById("submit-btn");

function showAlert(type, message) {
  alertBox.innerHTML = "";
  const div = document.createElement("div");
  div.className = `alert alert-${type}`;
  div.textContent = message;
  alertBox.appendChild(div);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  submitBtn.disabled = true;
  submitBtn.textContent = "Creating...";
  alertBox.innerHTML = "";

  const ticket = {
    customer_name: form.customer_name.value.trim(),
    customer_email: form.customer_email.value.trim(),
    subject: form.subject.value.trim(),
    description: form.description.value.trim(),
    priority: form.priority.value,
  };

  try {
    const { data, error } = await db
      .from("tickets")
      .insert(ticket)
      .select("ticket_id, created_at")
      .single();

    if (error) throw error;

    showAlert("success", `Ticket ${data.ticket_id} created successfully.`);
    form.reset();
  } catch (err) {
    console.error(err);
    showAlert("danger", err.message || "Something went wrong");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Create ticket";
  }
});
