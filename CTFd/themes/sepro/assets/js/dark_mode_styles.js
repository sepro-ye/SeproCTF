"use strict";

/**
 * Custom dark mode styling for SeproCTF
 * This file applies additional dark mode styling to elements
 */

document.addEventListener('DOMContentLoaded', function() {
  // Always set dark mode
  document.documentElement.classList.add('dark');
  
  // Apply dark mode styles to specific elements
  const applyDarkMode = () => {
    // Style cards
    document.querySelectorAll('.card').forEach(card => {
      card.classList.add('bg-dark-800', 'border-dark-700', 'shadow-lg');
    });
    
    // Style form controls
    document.querySelectorAll('.form-control').forEach(input => {
      input.classList.add('bg-dark-800', 'border-dark-700', 'text-gray-200');
    });
    
    document.querySelectorAll('.form-select').forEach(select => {
      select.classList.add('bg-dark-800', 'border-dark-700', 'text-gray-200');
    });
    
    // Style tables
    document.querySelectorAll('table').forEach(table => {
      table.classList.add('border-dark-700');
      
      // Style table headers
      table.querySelectorAll('th').forEach(th => {
        th.classList.add('bg-dark-800', 'text-gray-300', 'border-dark-700');
      });
      
      // Style table cells
      table.querySelectorAll('td').forEach(td => {
        td.classList.add('text-gray-300', 'border-dark-700');
      });
    });
    
    // Style code and pre elements
    document.querySelectorAll('pre').forEach(pre => {
      pre.classList.add('bg-dark-800', 'border', 'border-dark-700', 'rounded-lg', 'p-4', 'text-gray-300');
    });
    
    document.querySelectorAll('code').forEach(code => {
      code.classList.add('bg-dark-800', 'text-gray-300', 'p-1', 'rounded-md');
    });
    
    // Style challenge buttons
    document.querySelectorAll('.challenge-button').forEach(btn => {
      btn.classList.add('bg-dark-800', 'text-white', 'border', 'border-dark-700');
      
      // Add glow effect to solved challenges
      if (btn.classList.contains('challenge-solved')) {
        btn.classList.add('bg-primary-700', 'border-primary-600', 'shadow-glow');
      }
    });
  };
  
  // Apply dark mode styles
  applyDarkMode();
  
  // Also apply when new content is loaded dynamically
  // This is a common pattern for SPAs and AJAX-loaded content
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        applyDarkMode();
      }
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
});
