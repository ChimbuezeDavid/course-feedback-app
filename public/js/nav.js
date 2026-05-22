// nav.js — small helper to toggle nav on small screens and set active link
function initNav() {
  const toggle = document.getElementById('nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });
  }

  // Active link highlighting
  const anchors = document.querySelectorAll('.nav-links a');
  const path = location.pathname.split('/').pop() || 'index.html';
  anchors.forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;
    if (href.endsWith(path) || (path === '' && href.endsWith('index.html'))) {
      a.classList.add('active');
    }
  });
}

window.addEventListener('load', initNav);
