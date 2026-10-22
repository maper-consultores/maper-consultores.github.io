document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fadeEls = document.querySelectorAll('.fade');

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    fadeEls.forEach(el => el.classList.add('visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      threshold: .02
    });

    fadeEls.forEach(el => observer.observe(el));
  }

  // Mobile Menu Logic
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  const closeMobileMenu = () => {
    if (!mobileMenuBtn || !navLinks || !navLinks.classList.contains('nav-active')) return;
    mobileMenuBtn.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('nav-active');
    const iconMenu = mobileMenuBtn.querySelector('.icon-menu');
    const iconClose = mobileMenuBtn.querySelector('.icon-close');
    if (iconMenu) iconMenu.style.display = 'block';
    if (iconClose) iconClose.style.display = 'none';
    document.body.style.overflow = '';
  };

  if (mobileMenuBtn && navLinks) {
    const iconMenu = mobileMenuBtn.querySelector('.icon-menu');
    const iconClose = mobileMenuBtn.querySelector('.icon-close');

    const toggleMenu = () => {
      const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
      mobileMenuBtn.setAttribute('aria-expanded', String(!isExpanded));
      navLinks.classList.toggle('nav-active');

      if (!isExpanded) {
        iconMenu.style.display = 'none';
        iconClose.style.display = 'block';
        document.body.style.overflow = 'hidden';
      } else {
        iconMenu.style.display = 'block';
        iconClose.style.display = 'none';
        document.body.style.overflow = '';
      }
    };

    mobileMenuBtn.addEventListener('click', toggleMenu);

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (navLinks.classList.contains('nav-active')) {
          closeMobileMenu();
        }
      });
    });
  }

  // FAB Logic
  const fabToggleBtn = document.getElementById('fab-toggle-btn');
  const fabMenu = document.querySelector('.fab-menu');

  const setFabState = (open) => {
    if (!fabToggleBtn || !fabMenu) return;
    const iconChat = fabToggleBtn.querySelector('.icon-chat');
    const iconClose = fabToggleBtn.querySelector('.icon-close');
    fabMenu.classList.toggle('fab-active', open);
    fabToggleBtn.setAttribute('aria-expanded', String(open));
    if (iconChat) iconChat.style.display = open ? 'none' : 'block';
    if (iconClose) iconClose.style.display = open ? 'block' : 'none';
  };

  if (fabToggleBtn && fabMenu) {
    fabToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = fabMenu.classList.contains('fab-active');
      setFabState(!isActive);
    });

    document.addEventListener('click', (e) => {
      if (fabMenu.classList.contains('fab-active') && !e.target.closest('.fab-wrapper')) {
        setFabState(false);
      }
    });
  }

  // Keyboard Escape handler for menus
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (navLinks && navLinks.classList.contains('nav-active')) {
        closeMobileMenu();
        if (mobileMenuBtn) mobileMenuBtn.focus();
      }
      if (fabMenu && fabMenu.classList.contains('fab-active')) {
        setFabState(false);
        if (fabToggleBtn) fabToggleBtn.focus();
      }
    }
  });
});
