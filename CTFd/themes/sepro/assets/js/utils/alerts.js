/**
 * Simple custom Alert implementation to replace Bootstrap's Alert component
 */
class Alert {
  constructor(element) {
    this.element = element;
    
    // Add close button functionality
    const closeBtn = element.querySelector('.btn-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }
  }
  
  close() {
    // Trigger closing animation
    this.element.classList.add('opacity-0');
    
    // Remove element after animation
    setTimeout(() => {
      this.element.remove();
    }, 150); // Match transition duration
  }
}

export default () => {
  const alertList = [].slice.call(document.querySelectorAll(".alert"));
  alertList.map(function (element) {
    return new Alert(element);
  });
};
