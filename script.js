
"use strict";

// ========================================
// VELVET CANVAS — PORTFOLIO JAVASCRIPT
// ========================================

// Theme elements
const root = document.documentElement;
const themeToggle = document.querySelector("#theme-toggle");
const themeIcon = document.querySelector("#theme-icon");
const themeLabel = document.querySelector("#theme-label");
const themeColor = document.querySelector('meta[name="theme-color"]');

// Read the saved theme.
function getSavedTheme() {
  try {
    return localStorage.getItem("velvet-canvas-theme");
  } catch (error) {
    return null;
  }
}

// Apply the selected theme.
function setTheme(theme) {
  const selectedTheme = theme === "dark" ? "dark" : "light";

  root.dataset.theme = selectedTheme;

  if (themeIcon) {
    themeIcon.textContent = selectedTheme === "dark" ? "☀" : "☾";
  }

  if (themeLabel) {
    themeLabel.textContent =
      selectedTheme === "dark" ? "Light mode" : "Dark mode";
  }

  if (themeToggle) {
    themeToggle.setAttribute(
      "aria-label",
      selectedTheme === "dark"
        ? "Switch to light mode"
        : "Switch to dark mode"
    );
  }

  if (themeColor) {
    themeColor.content =
      selectedTheme === "dark" ? "#171522" : "#fbfaff";
  }

  try {
    localStorage.setItem("velvet-canvas-theme", selectedTheme);
  } catch (error) {
    // The theme still works if browser storage is unavailable.
  }
}

// Restore the saved theme, or use light mode for first-time visitors.
setTheme(getSavedTheme() === "dark" ? "dark" : "light");

// One theme button click handler.
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const currentTheme = root.dataset.theme;
    setTheme(currentTheme === "dark" ? "light" : "dark");
  });
}

// ========================================
// GALLERY CATEGORY FILTERS
// ========================================

const filters = document.querySelectorAll(".filter");
const artworkCards = document.querySelectorAll(".art-card");

filters.forEach((button) => {
  button.addEventListener("click", () => {
    const category = button.dataset.filter;

    filters.forEach((filter) => {
      const selected = filter === button;

      filter.classList.toggle("active", selected);
      filter.setAttribute("aria-pressed", String(selected));
    });

    artworkCards.forEach((card) => {
      card.hidden =
        category !== "all" && card.dataset.category !== category;
    });
  });
});

// ========================================
// ARTWORK PREVIEW WINDOW
// ========================================

const dialog = document.querySelector("#art-dialog");
const dialogImage = document.querySelector("#dialog-image");
const dialogTitle = document.querySelector("#dialog-title");
const dialogDescription = document.querySelector("#dialog-description");
const closeDialog = document.querySelector("#dialog-close");

 // Open previews for dynamically loaded artwork.
document.addEventListener("click", (event) => {
  const button = event.target.closest(".art-image");

  if (!button) return;

  if (!dialog || !dialogImage || !dialogTitle || !dialogDescription) {
    console.error("Artwork preview dialog elements are missing.");
    return;
  }

  const image = button.querySelector("img");

  if (!image) {
    console.error("Artwork image was not found.");
    return;
  }

  dialogImage.src = image.currentSrc || image.src;
  dialogImage.alt = image.alt || "Artwork";
  dialogTitle.textContent =
    button.dataset.title || image.alt || "Artwork";
  dialogDescription.textContent =
    button.dataset.description || "";

  if (typeof dialog.showModal === "function") {
    if (!dialog.open) {
      dialog.showModal();
    }
  } else {
    console.error("Your browser does not support the preview dialog.");
  }
});

// Close the artwork preview using its close button.
if (closeDialog && dialog) {
  closeDialog.addEventListener("click", () => {
    dialog.close();
  });

  // Close when clicking the dialog backdrop.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });
}

/* Hidden artist login shortcut: Ctrl + Shift + L */
document.addEventListener("keydown", (event) => {
  if (
    event.ctrlKey &&
    event.shiftKey &&
    event.key.toLowerCase() === "l"
  ) {
    event.preventDefault();
    window.location.href = "./login.html";
  }
});
