/**
 * Simple custom Tooltip implementation to replace Bootstrap's Tooltip component
 */
class Tooltip {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      title: element.getAttribute('title') || element.getAttribute('data-bs-title') || '',
      placement: element.getAttribute('data-bs-placement') || 'top',
      trigger: element.getAttribute('data-bs-trigger') || 'hover focus',
      ...options
    };
    
    this.tooltipElement = null;
    this.isShown = false;
    
    // Remove default title attribute to prevent native tooltip
    if (element.getAttribute('title')) {
      element.setAttribute('data-bs-title', element.getAttribute('title'));
      element.removeAttribute('title');
    }
    
    this._initEvents();
  }
  
  _initEvents() {
    if (this.options.trigger.includes('hover')) {
      this.element.addEventListener('mouseenter', () => this.show());
      this.element.addEventListener('mouseleave', () => this.hide());
    }
    
    if (this.options.trigger.includes('focus')) {
      this.element.addEventListener('focus', () => this.show());
      this.element.addEventListener('blur', () => this.hide());
    }
    
    if (this.options.trigger.includes('click')) {
      this.element.addEventListener('click', () => this.toggle());
    }
    
    if (this.options.trigger === 'manual') {
      // Do nothing, will be triggered programmatically
    }
  }
  
  _createTooltipElement() {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip opacity-0 absolute z-50 px-2 py-1 text-xs font-medium text-white bg-black rounded shadow-sm transition-opacity duration-150';
    tooltip.innerHTML = this.options.title;
    tooltip.setAttribute('role', 'tooltip');
    document.body.appendChild(tooltip);
    return tooltip;
  }
  
  _positionTooltip() {
    if (!this.tooltipElement) return;
    
    const elementRect = this.element.getBoundingClientRect();
    const tooltipRect = this.tooltipElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    let top, left;
    
    switch (this.options.placement) {
      case 'top':
        top = elementRect.top + scrollTop - tooltipRect.height - 10;
        left = elementRect.left + scrollLeft + (elementRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'bottom':
        top = elementRect.bottom + scrollTop + 10;
        left = elementRect.left + scrollLeft + (elementRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'left':
        top = elementRect.top + scrollTop + (elementRect.height / 2) - (tooltipRect.height / 2);
        left = elementRect.left + scrollLeft - tooltipRect.width - 10;
        break;
      case 'right':
        top = elementRect.top + scrollTop + (elementRect.height / 2) - (tooltipRect.height / 2);
        left = elementRect.right + scrollLeft + 10;
        break;
    }
    
    this.tooltipElement.style.top = `${top}px`;
    this.tooltipElement.style.left = `${left}px`;
  }
  
  show() {
    if (this.isShown) return;
    
    this.tooltipElement = this._createTooltipElement();
    this._positionTooltip();
    
    // Show with animation
    setTimeout(() => {
      this.tooltipElement.classList.remove('opacity-0');
      this.tooltipElement.classList.add('opacity-100');
      this.isShown = true;
    }, 10);
  }
  
  hide() {
    if (!this.isShown || !this.tooltipElement) return;
    
    this.tooltipElement.classList.remove('opacity-100');
    this.tooltipElement.classList.add('opacity-0');
    
    // Remove from DOM after transition
    setTimeout(() => {
      if (this.tooltipElement) {
        this.tooltipElement.remove();
        this.tooltipElement = null;
      }
      this.isShown = false;
    }, 150);
  }
  
  toggle() {
    this.isShown ? this.hide() : this.show();
  }
}

export default () => {
  const tooltipList = [].slice.call(
    document.querySelectorAll('[data-bs-toggle="tooltip"]'),
  );
  tooltipList.map(element => {
    return new Tooltip(element);
  });
};

// Export the Tooltip class for use elsewhere
export { Tooltip };
