/**
 * Simple custom modal implementation to replace Bootstrap's Modal component
 */
export class Modal {
  constructor(element) {
    this.element = typeof element === 'string' ? document.querySelector(element) : element;
    this.isShown = false;
    this._initializeEvents();
  }

  _initializeEvents() {
    // Close modal when clicking on backdrop or close button
    this.element.addEventListener('click', (event) => {
      if (event.target === this.element || 
          event.target.classList.contains('modal-close') ||
          event.target.getAttribute('data-dismiss') === 'modal') {
        this.hide();
      }
    });
    
    // Close on ESC key
    document.addEventListener('keydown', (event) => {
      if (this.isShown && event.key === 'Escape') {
        this.hide();
      }
    });
  }

  show() {
    this.isShown = true;
    document.body.classList.add('modal-open');
    this.element.classList.remove('hidden');
    this.element.classList.add('block');
    
    // Trigger shown event
    const event = new Event('shown.bs.modal');
    this.element.dispatchEvent(event);
  }

  hide() {
    this.isShown = false;
    document.body.classList.remove('modal-open');
    this.element.classList.add('hidden');
    this.element.classList.remove('block');
    
    // Trigger hidden event
    const event = new Event('hidden.bs.modal');
    this.element.dispatchEvent(event);
  }

  toggle() {
    if (this.isShown) {
      this.hide();
    } else {
      this.show();
    }
  }

  static getOrCreateInstance(element) {
    return new Modal(element);
  }
}
