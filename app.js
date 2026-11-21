const icons = {
  folder:'<path d="M3 6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v10H3Z"/>',
  network:'<circle cx="12" cy="12" r="3"/><circle cx="4" cy="5" r="2"/><circle cx="20" cy="4" r="2"/><circle cx="20" cy="20" r="2"/><circle cx="4" cy="20" r="2"/><path d="m6 7 4 3m4-1 4-4m-4 9 4 4m-8-3-4 3"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  lock:'<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
  shield:'<path d="M12 3 3 7v5c0 5 9 9 9 9s9-4 9-9V7Z"/><path d="m8 12 3 3 5-6"/>',
  share:'<path d="M8 12H5v9h14v-9h-3m-4 4V3m-4 4 4-4 4 4"/>',
  box:'<path d="m3 7 9-4 9 4-9 4Zm0 0v10l9 4 9-4V7M12 11v10"/>',
  audio:'<path d="M3 10v4m4-7v10m5-14v18m5-14v10m4-7v4"/>',
  document:'<path d="M6 3h8l4 4v14H6Zm8 0v5h4M9 12h6m-6 4h6"/>',
  laptop:'<rect x="4" y="4" width="16" height="12" rx="2"/><path d="M2 20h20l-2-4H4Z"/>',
  phone:'<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M10 18h4"/>'
};
document.querySelectorAll('[data-icon]').forEach(el => {
  el.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[el.dataset.icon] || ''}</svg>`;
});

const downloadDialog = document.querySelector('#download-dialog');
document.querySelectorAll('[data-download]').forEach(button => {
  button.addEventListener('click', () => downloadDialog.showModal());
});
document.querySelector('#close-download').addEventListener('click', () => downloadDialog.close());
downloadDialog.addEventListener('click', event => {
  if (event.target !== downloadDialog) return;
  const bounds = downloadDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) downloadDialog.close();
});

// Use the full-resolution PNG rather than the thumbnail selected by <picture>.
const screenshotImages = document.querySelectorAll('img[data-screenshot]');
if (screenshotImages.length) {
  const viewer = document.createElement('dialog');
  viewer.className = 'screenshot-viewer';
  viewer.innerHTML = '<button class="screenshot-close" type="button" autofocus><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button><img class="screenshot-enlarged" alt="">';
  document.body.append(viewer);
  const enlarged = viewer.querySelector('img');
  const close = viewer.querySelector('button');
  let previousOverflow;
  let opener;

  const openScreenshot = image => {
    const english = document.documentElement.lang.startsWith('en');
    viewer.setAttribute('aria-label', english ? 'Enlarged screenshot' : '截图预览');
    close.setAttribute('aria-label', english ? 'Close screenshot' : '关闭截图');
    enlarged.src = image.src;
    enlarged.alt = image.alt;
    opener = image;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    viewer.showModal();
  };

  screenshotImages.forEach(image => {
    image.tabIndex = 0;
    image.setAttribute('role', 'button');
    image.setAttribute('aria-haspopup', 'dialog');
    image.addEventListener('click', () => openScreenshot(image));
    image.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openScreenshot(image);
    });
  });
  close.addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', event => {
    if (event.target === viewer) viewer.close();
  });
  viewer.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    enlarged.removeAttribute('src');
    opener?.focus({ preventScroll: true });
  });
}
