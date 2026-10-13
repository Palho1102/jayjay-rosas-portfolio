/**
 * Modal Handling Module
 */

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');
  }
}

// Global Event Delegation (works seamlessly with dynamically injected HTML sections)
document.addEventListener('click', (event) => {
  // 1. Open button click
  const openBtn = event.target.closest('[data-modal-target]');
  if (openBtn) {
    event.preventDefault();
    const modalId = openBtn.getAttribute('data-modal-target');
    openModal(modalId);
    return;
  }

  // 2. Close button click
  const closeBtn = event.target.closest('[data-modal-close]');
  if (closeBtn) {
    event.preventDefault();
    const modalId = closeBtn.getAttribute('data-modal-close');
    closeModal(modalId);
    return;
  }

  // 3. Click outside modal box (backdrop overlay)
  if (event.target.classList.contains('fixed') && !event.target.classList.contains('hidden') && event.target.id) {
    closeModal(event.target.id);
  }
});

// Close active modal on Escape key press
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    const visibleModals = document.querySelectorAll('.fixed:not(.hidden)');
    visibleModals.forEach((modal) => {
      if (modal.id) {
        closeModal(modal.id);
      }
    });
  }
});