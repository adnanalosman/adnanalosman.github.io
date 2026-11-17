/* Run before CSS to avoid a flash of the wrong theme. */
(() => {
  document.documentElement.classList.add('js');
  let preferred;
  try { preferred = localStorage.getItem('adnan-theme'); } catch { /* Storage may be unavailable. */ }
  const dark = preferred ? preferred === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
})();
