/**
 * Showcase expand/collapse — immediate state changes, no animation runtime.
 * Supports multiple showcases on the page.
 */

document.querySelectorAll('.showcase').forEach((showcase) => {
  const features = showcase.querySelector('.showcase-features');
  const btn = showcase.querySelector('.showcase-expand-btn');
  if (!features || !btn) return;

  btn.setAttribute('aria-expanded', 'false');

  btn.addEventListener('click', () => {
    const isCollapsed = features.classList.toggle('is-collapsed');

    btn.classList.toggle('is-expanded', !isCollapsed);
    btn.setAttribute('aria-expanded', String(!isCollapsed));
    btn.childNodes[0].textContent = isCollapsed
      ? 'Explorer les fonctionnalités '
      : 'Voir moins ';

    if (isCollapsed) showcase.scrollIntoView();
  });
});
