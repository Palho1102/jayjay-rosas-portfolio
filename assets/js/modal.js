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

/**
 * Certificate / Document Viewer Controller
 */
function openCertificateViewer(certId) {
  if (typeof CERTIFICATES_DATA === 'undefined') {
    alert('Certificates data registry is unavailable.');
    return;
  }

  const cert = CERTIFICATES_DATA.find((c) => c.id === certId);
  if (!cert) {
    alert('Selected document could not be found.');
    return;
  }

  const filePath = cert.file || cert.fallbackFile;

  // If marked to open directly in a new tab (e.g. OJT Documentation packet)
  if (cert.openInNewTab) {
    window.open(filePath, '_blank', 'noopener,noreferrer');
    return;
  }

  const modal = document.getElementById('certificateViewerModal');
  if (!modal) {
    if (filePath) {
      window.open(filePath, '_blank', 'noopener,noreferrer');
    }
    return;
  }

  // Populate metadata
  const titleEl = document.getElementById('modalCertTitle');
  const issuerEl = document.getElementById('modalCertIssuer');
  const dateEl = document.getElementById('modalCertDate');
  const pdfObject = document.getElementById('modalPdfObject');
  const pdfFrame = document.getElementById('modalPdfFrame');
  const fallbackLink = document.getElementById('modalFallbackLink');
  const externalBtn = document.getElementById('modalExternalBtn');
  const verifyBtn = document.getElementById('modalVerifyBtn');

  if (titleEl) titleEl.textContent = cert.title;
  if (issuerEl) issuerEl.textContent = cert.issuer;
  if (dateEl) dateEl.textContent = cert.date;

  if (pdfObject) pdfObject.setAttribute('data', filePath);
  if (pdfFrame) pdfFrame.setAttribute('src', filePath);
  if (fallbackLink) fallbackLink.setAttribute('href', filePath);
  if (externalBtn) externalBtn.setAttribute('href', filePath);

  if (verifyBtn) {
    if (cert.verifyUrl) {
      verifyBtn.setAttribute('href', cert.verifyUrl);
      verifyBtn.classList.remove('hidden');
    } else {
      verifyBtn.classList.add('hidden');
    }
  }

  if (window.CertMarqueeEngine && typeof window.CertMarqueeEngine.setModalActive === 'function') {
    window.CertMarqueeEngine.setModalActive(true);
  }

  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function closeCertificateModal() {
  const modal = document.getElementById('certificateViewerModal');
  if (modal) {
    modal.classList.add('hidden');
    document.body.classList.remove('overflow-hidden');

    const pdfObject = document.getElementById('modalPdfObject');
    const pdfFrame = document.getElementById('modalPdfFrame');
    if (pdfObject) pdfObject.setAttribute('data', '');
    if (pdfFrame) pdfFrame.setAttribute('src', '');
  }

  if (window.CertMarqueeEngine && typeof window.CertMarqueeEngine.setModalActive === 'function') {
    window.CertMarqueeEngine.setModalActive(false);
  }
}

// Global Event Delegation for modal actions
document.addEventListener('click', (event) => {
  const openBtn = event.target.closest('[data-modal-target]');
  if (openBtn) {
    event.preventDefault();
    const modalId = openBtn.getAttribute('data-modal-target');
    openModal(modalId);
    return;
  }

  const closeBtn = event.target.closest('[data-modal-close]');
  if (closeBtn) {
    event.preventDefault();
    const modalId = closeBtn.getAttribute('data-modal-close');
    closeModal(modalId);
    return;
  }

  const certModal = document.getElementById('certificateViewerModal');
  if (certModal && !certModal.classList.contains('hidden') && event.target === certModal) {
    closeCertificateModal();
    return;
  }

  if (event.target.classList.contains('fixed') && !event.target.classList.contains('hidden') && event.target.id && event.target.id !== 'certificateViewerModal') {
    closeModal(event.target.id);
  }
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    const certModal = document.getElementById('certificateViewerModal');
    if (certModal && !certModal.classList.contains('hidden')) {
      closeCertificateModal();
    }

    const visibleModals = document.querySelectorAll('.fixed:not(.hidden)');
    visibleModals.forEach((modal) => {
      if (modal.id && modal.id !== 'certificateViewerModal') {
        closeModal(modal.id);
      }
    });
  }
}); 