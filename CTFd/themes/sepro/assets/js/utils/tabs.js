/**
 * Simple custom tab implementation to replace Bootstrap's Tab component
 */
export default function initTabs() {
  document.querySelectorAll('[role="tab"]').forEach(tabEl => {
    tabEl.addEventListener('click', event => {
      event.preventDefault();
      
      // Get the target tab pane
      const target = document.querySelector(tabEl.dataset.bsTarget || tabEl.getAttribute('href'));
      if (!target) return;
      
      // Hide all tab panes
      const parent = target.closest('.tab-content');
      if (parent) {
        parent.querySelectorAll('.tab-pane').forEach(pane => {
          pane.classList.remove('active', 'show');
          pane.classList.add('hidden');
        });
      }
      
      // Show the target tab pane
      target.classList.add('active', 'show');
      target.classList.remove('hidden');
      
      // Update active state on tabs
      if (tabEl.parentElement) {
        const tabList = tabEl.closest('[role="tablist"]');
        if (tabList) {
          tabList.querySelectorAll('[role="tab"]').forEach(tab => {
            tab.setAttribute('aria-selected', 'false');
            tab.classList.remove('active');
          });
        }
      }
      
      tabEl.setAttribute('aria-selected', 'true');
      tabEl.classList.add('active');
    });
  });
}

// Custom Tab class to replace Bootstrap's Tab
export class Tab {
  constructor(element) {
    this.element = element;
  }
  
  show() {
    // Trigger a click on the element to show the tab
    this.element.click();
  }
  
  static getOrCreateInstance(element) {
    // Simple factory to create or return an instance
    return new Tab(element);
  }
}
