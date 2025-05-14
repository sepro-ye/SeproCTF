/**
 * Simple custom toast implementation to replace Bootstrap's Toast component
 */
export class Toast {
  constructor(element) {
    this.element = typeof element === 'string' ? document.querySelector(element) : element;
    this._element = this.element; // For compatibility with Bootstrap's Toast
    this.isShown = false;
    this._initializeEvents();
  }

  _initializeEvents() {
    // Close toast when clicking on close button
    const closeButton = this.element.querySelector('[data-bs-dismiss="toast"]');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.hide();
      });
    }
    
    // Auto-hide after a delay
    if (this.element.dataset.bsDelay) {
      const delay = parseInt(this.element.dataset.bsDelay, 10);
      if (!isNaN(delay)) {
        this._timeoutId = setTimeout(() => {
          this.hide();
        }, delay);
      }
    }
  }

  show() {
    this.isShown = true;
    this.element.classList.add('showing');
    
    // Use a small timeout to ensure transitions work properly
    setTimeout(() => {
      this.element.classList.remove('showing');
      this.element.classList.add('show');
      
      // Trigger shown event for compatibility
      const event = new Event('shown.bs.toast');
      this.element.dispatchEvent(event);
    }, 10);
  }

  hide() {
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
    }
    
    this.isShown = false;
    this.element.classList.add('hiding');
    this.element.classList.remove('show');
    
    // Wait for animation to complete
    setTimeout(() => {
      this.element.classList.remove('hiding');
      
      // Trigger hidden event for compatibility
      const event = new Event('hidden.bs.toast');
      this.element.dispatchEvent(event);
    }, 150);
  }

  dispose() {
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
    }
    
    // Remove event listeners
    const closeButton = this.element.querySelector('[data-bs-dismiss="toast"]');
    if (closeButton) {
      closeButton.removeEventListener('click', this.hide);
    }
  }
}
