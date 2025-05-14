/**
 * Simple custom Collapse implementation to replace Bootstrap's Collapse component
 */
class Collapse {
  constructor(element, options = {}) {
    this.element = element;
    this.isShown = !element.classList.contains('hidden') && element.classList.contains('show');
    this.options = options;
    
    // Initialize trigger elements
    document.querySelectorAll(`[data-bs-toggle="collapse"][href="#${element.id}"], [data-bs-toggle="collapse"][data-bs-target="#${element.id}"]`).forEach(trigger => {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggle();
      });
    });
    
    // Apply initial state if needed
    if (options.toggle === true) {
      this.toggle();
    }
  }
  
  show() {
    if (this.isShown) return;
    
    this.element.classList.remove('hidden');
    // Give the browser time to process the display change before adding the show class
    setTimeout(() => {
      this.element.classList.add('show');
      this.isShown = true;
    }, 5);
  }
  
  hide() {
    if (!this.isShown) return;
    
    this.element.classList.remove('show');
    // Wait for transition to finish before hiding
    setTimeout(() => {
      this.element.classList.add('hidden');
      this.isShown = false;
    }, 150); // Match transition duration
  }
  
  toggle() {
    this.isShown ? this.hide() : this.show();
  }
}

export default () => {
  const collapseList = [].slice.call(document.querySelectorAll(".collapse"));
  collapseList.map(element => {
    return new Collapse(element, { toggle: false });
  });
};
