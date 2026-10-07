const lb = document.getElementById('lightbox') as HTMLElement;
const lbImg = document.getElementById('lightbox-img') as HTMLImageElement;

function openLightbox(src: string, alt: string) {
  lbImg.src = src;
  lbImg.alt = alt || '';
  lb.classList.add('lightbox-open');
  lb.setAttribute('aria-hidden', 'false');
}
function closeLightbox() {
  lb.classList.remove('lightbox-open');
  lb.setAttribute('aria-hidden', 'true');
}

document.querySelectorAll<HTMLImageElement>('.polaroid img').forEach(function (img) {
  img.style.cursor = 'pointer';
  img.addEventListener('click', function () {
    openLightbox(this.src, this.alt);
  });
});
lb.addEventListener('click', closeLightbox);
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && lb.classList.contains('lightbox-open')) {
    closeLightbox();
  }
});
