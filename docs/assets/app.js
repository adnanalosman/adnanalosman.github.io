(() => {
  const root = document.documentElement;
  const themeButton = document.querySelector('.theme-toggle');
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#navigation');
  const themeMedia = window.matchMedia('(prefers-color-scheme: dark)');
  const updateThemeLabel = () => {
    const dark = root.dataset.theme === 'dark';
    themeButton.setAttribute('aria-label', dark ? themeButton.dataset.light : themeButton.dataset.dark);
    document.querySelector('meta[name="theme-color"]').content = dark ? '#121b17' : '#f6f7f2';
  };
  updateThemeLabel();
  themeButton.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('adnan-theme', root.dataset.theme); } catch { /* Theme still works for this page. */ }
    updateThemeLabel();
  });
  themeMedia.addEventListener('change', event => {
    let preference;
    try { preference = localStorage.getItem('adnan-theme'); } catch { /* Use system preference. */ }
    if (!preference) { root.dataset.theme = event.matches ? 'dark' : 'light'; updateThemeLabel(); }
  });
  const closeMenu = () => {
    navigation.classList.remove('is-open');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', menuButton.dataset.open);
  };
  menuButton.addEventListener('click', () => {
    const opened = navigation.classList.toggle('is-open');
    menuButton.setAttribute('aria-expanded', String(opened));
    menuButton.setAttribute('aria-label', opened ? menuButton.dataset.close : menuButton.dataset.open);
  });
  navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && navigation.classList.contains('is-open')) { closeMenu(); menuButton.focus(); }
  });
  document.addEventListener('click', event => { if (!event.target.closest('.nav-shell')) closeMenu(); });
  window.matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);
  const languageLink = document.querySelector('.language');
  const syncLanguageAnchor = () => { languageLink.hash = location.hash; };
  syncLanguageAnchor();
  window.addEventListener('hashchange', syncLanguageAnchor);
  document.querySelector('[data-copy]').addEventListener('click', async event => {
    const button = event.currentTarget;
    const status = document.querySelector('.copy-status');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(button.dataset.copy);
      status.textContent = document.body.dataset.copySuccess;
    } catch { status.textContent = document.body.dataset.copyError; }
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navigation.querySelectorAll('a').forEach(a => {
          if (a.hash === '#' + entry.target.id) a.setAttribute('aria-current', 'location');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-15% 0px -60% 0px' });
    ['work','expertise','about','journey'].forEach(id => observer.observe(document.getElementById(id)));
  }
  root.classList.add('js');
})();
