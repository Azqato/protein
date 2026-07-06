// In-app confirm/alert replacement, styled to match the rest of the design system
// instead of native browser dialogs. Traps focus while open and restores it on close.

function showModal({ title, message, buttons }) {
  const backdrop = document.getElementById("modalBackdrop");
  const titleEl = document.getElementById("modalTitle");
  const messageEl = document.getElementById("modalMessage");
  const actionsEl = document.getElementById("modalActions");
  const previouslyFocused = document.activeElement;

  titleEl.textContent = title;
  messageEl.textContent = message;
  actionsEl.innerHTML = "";

  function close() {
    backdrop.hidden = true;
    document.removeEventListener("keydown", onKeydown);
    if (previouslyFocused && typeof previouslyFocused.focus === "function") {
      previouslyFocused.focus();
    }
  }

  function onKeydown(event) {
    if (event.key === "Escape") {
      close();
      return;
    }
    if (event.key === "Tab") {
      const focusable = actionsEl.querySelectorAll("button");
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  buttons.forEach((btn, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = btn.primary ? "btn-primary" : "btn-secondary";
    button.textContent = btn.label;
    button.addEventListener("click", () => {
      close();
      if (btn.onClick) btn.onClick();
    });
    actionsEl.appendChild(button);
  });

  backdrop.hidden = false;
  document.addEventListener("keydown", onKeydown);
  const firstButton = actionsEl.querySelector("button");
  if (firstButton) firstButton.focus();
}

function confirmModal(message, title = "Confirm") {
  return new Promise((resolve) => {
    showModal({
      title,
      message,
      buttons: [
        { label: "Cancel", onClick: () => resolve(false) },
        { label: "Continue", primary: true, onClick: () => resolve(true) },
      ],
    });
  });
}

function alertModal(message, title = "Notice") {
  return new Promise((resolve) => {
    showModal({
      title,
      message,
      buttons: [{ label: "OK", primary: true, onClick: () => resolve() }],
    });
  });
}
