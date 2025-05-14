"use strict";

/**
 * This file is simplified to enforce dark mode only
 * as per the updated design requirements
 */

// Always set dark mode
localStorage.setItem("theme", "dark");
document.documentElement.setAttribute("data-mdb-theme", "dark");
document.documentElement.classList.add("dark");

// Remove theme switcher buttons from DOM when the page loads
window.addEventListener("load", () => {
  // Remove theme switcher buttons from DOM
  const themeSwitchers = document.querySelectorAll(".theme-switch");
  themeSwitchers.forEach(el => {
    el.style.display = "none";
  });
});
