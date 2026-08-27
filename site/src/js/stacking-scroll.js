export const STACKING_SECTION_SELECTOR = [
  '.hero ~ .section',
  '.hero ~ section',
  '.page-hero ~ .section',
  '.page-hero ~ section',
].join(', ');

export function applyStackingLayers(sections) {
  [...sections].forEach((section, index) => {
    section.style.zIndex = String(index + 1);
  });
}

export function updateStickySectionTops(sections, viewportHeight, getPosition) {
  [...sections].forEach((section) => {
    if (getPosition(section) !== 'sticky') {
      section.style.top = '';
      return;
    }

    section.style.top = section.offsetHeight > viewportHeight
      ? `${viewportHeight - section.offsetHeight}px`
      : '0px';
  });
}

export function getSectionScrollTarget(target, documentRef) {
  const hero = documentRef.querySelector('.hero, .page-hero');
  let position = 0;
  let sibling = hero;

  while (sibling) {
    if (sibling === target) return position;
    position += sibling.offsetHeight;
    sibling = sibling.nextElementSibling;
  }

  return target.offsetTop ?? 0;
}

export function initializeStackingScroll(documentRef, windowRef, ResizeObserverClass = globalThis.ResizeObserver) {
  const sections = [...documentRef.querySelectorAll(STACKING_SECTION_SELECTOR)];
  const update = () => updateStickySectionTops(
    sections,
    windowRef.innerHeight,
    (section) => windowRef.getComputedStyle(section).position,
  );

  applyStackingLayers(sections);
  update();
  windowRef.addEventListener('resize', update);

  const observer = typeof ResizeObserverClass === 'function'
    ? new ResizeObserverClass(update)
    : null;
  sections.forEach((section) => observer?.observe(section));

  return {
    sections,
    update,
    destroy() {
      windowRef.removeEventListener?.('resize', update);
      observer?.disconnect();
    },
  };
}
