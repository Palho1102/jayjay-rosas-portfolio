/**
 * Modal System
 */

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }
}

/**
 * Certificate Viewer Modal
 * Called ONLY when "View Certificate" is explicitly clicked.
 */
function openCertificateViewer(certId) {
  if (typeof CERTIFICATES_DATA === 'undefined') return;

  const cert = CERTIFICATES_DATA.find((c) => c.id === certId);
  if (!cert) return;

  // Pause carousel immediately without losing position
  if (window.CertMarqueeEngine) {
    window.CertMarqueeEngine.setModalActive(true);
  }

  // Populate modal data
  document.getElementById('modalCertTitle').textContent = cert.title;
  document.getElementById('modalCertIssuer').textContent = cert.issuer;
  document.getElementById('modalCertDate').textContent = cert.date;

  const pdfObject = document.getElementById('modalPdfObject');
  const pdfFrame = document.getElementById('modalPdfFrame');
  const fallbackLink = document.getElementById('modalFallbackLink');
  const externalBtn = document.getElementById('modalExternalBtn');
  const verifyBtn = document.getElementById('modalVerifyBtn');

  if (pdfObject) pdfObject.data = cert.file;
  if (pdfFrame) pdfFrame.src = cert.file;
  if (fallbackLink) fallbackLink.href = cert.file;
  if (externalBtn) externalBtn.href = cert.file;

  if (cert.verifyUrl && cert.verifyUrl.trim() !== '') {
    verifyBtn.href = cert.verifyUrl;
    verifyBtn.classList.remove('hidden');
  } else {
    verifyBtn.classList.add('hidden');
  }

  const certModal = document.getElementById('certificateViewerModal');
  if (certModal) {
    certModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  if (window.lucide) lucide.createIcons();
}

function closeCertificateModal() {
  const certModal = document.getElementById('certificateViewerModal');
  if (certModal) {
    certModal.classList.add('hidden');
    document.body.style.overflow = 'auto';

    const pdfObject = document.getElementById('modalPdfObject');
    const pdfFrame = document.getElementById('modalPdfFrame');
    if (pdfObject) pdfObject.data = '';
    if (pdfFrame) pdfFrame.src = '';
  }

  // Resume auto-marquee immediately from current position
  if (window.CertMarqueeEngine) {
    window.CertMarqueeEngine.setModalActive(false);
  }
}

// Global modal background dismiss listener
window.addEventListener('click', (e) => {
  if (e.target.id === 'certificateViewerModal') {
    closeCertificateModal();
  } else if (e.target.classList.contains('backdrop-blur-sm') || e.target.classList.contains('backdrop-blur-xs')) {
    e.target.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }
});

// Escape key listener
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeCertificateModal();
    const openModals = document.querySelectorAll('[id$="Modal"]');
    openModals.forEach((modal) => {
      if (!modal.classList.contains('hidden')) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
      }
    });
  }
});