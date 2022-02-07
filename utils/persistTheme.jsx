// eslint-disable-next-line max-len
if (localStorage.getItem('pntDarkTheme') === 'true' || (!('pntDarkTheme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
  document.documentElement.style.cssText = 'color-scheme:dark';
} else {
  document.documentElement.classList.remove('dark');
  document.documentElement.style.cssText = 'color-scheme:light';
}
