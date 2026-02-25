/**
 * Brief — interactive project document
 * Everything on one screen, inline selections, zero steps
 */

import { gsap } from 'gsap';

const doc = document.getElementById('brief-doc');
if (doc) {

  const $ = id => document.getElementById(id);
  const state = { intent: null, services: [], modules: [], budgetRange: 0, timeline: null, mType: null, mCadre: null, mDuree: null, mRemote: null };

  const moduleData = {
    app: [
      { id: 'dashboard', label: 'Dashboard', desc: 'Tableaux de bord, métriques' },
      { id: 'users', label: 'Utilisateurs', desc: 'Comptes, rôles, droits' },
      { id: 'automation', label: 'Automatisations', desc: 'Workflows, tâches auto' },
      { id: 'api', label: 'API', desc: 'Connexion à vos outils' },
      { id: 'admin', label: 'Back-office', desc: 'Interface de gestion' },
      { id: 'notifs', label: 'Notifications', desc: 'Emails, alertes, rappels' },
    ],
    connector: [
      { id: 'sync', label: 'Sync', desc: 'Données en temps réel' },
      { id: 'monitoring', label: 'Monitoring', desc: 'État des syncs, alertes' },
      { id: 'webhooks', label: 'Webhooks', desc: 'Événements temps réel' },
      { id: 'reconciliation', label: 'Réconciliation', desc: 'Résolution de conflits' },
    ],
    site: [
      { id: 'design', label: 'Design', desc: 'Identité visuelle unique' },
      { id: 'payment', label: 'Paiement', desc: 'Stripe, CB, factures' },
      { id: 'client-area', label: 'Espace client', desc: 'Compte, historique, profil' },
      { id: 'backoffice', label: 'Back-office', desc: 'Gestion contenu et commandes' },
      { id: 'seo', label: 'SEO', desc: 'Référencement optimisé' },
      { id: 'newsletter', label: 'Newsletter', desc: 'Mails, automation' },
    ],
    web3: [
      { id: 'chain-data', label: 'Analyse on-chain', desc: 'Extraction données blockchain' },
      { id: 'wallet-tracking', label: 'Tracking wallets', desc: 'Suivi de wallets, patterns' },
      { id: 'token-tools', label: 'Outils tokens', desc: 'Analyse, filtrage, alertes' },
      { id: 'web3-integration', label: 'Intégration Web3', desc: 'Blockchain dans une app' },
    ],
  };

  const budgetRanges = ['< 1 000 €', '1 000 - 3 000 €', '3 000 - 7 000 €', '7 000 - 15 000 €', '15 000 €+'];
  const skipServices = ['other', 'conseil'];

  function bounce(el) { gsap.fromTo(el, { scale: 0.92 }, { scale: 1, duration: 0.25, ease: 'back.out(2)' }); }

  function showRow(id) {
    const row = $(id);
    if (!row || !row.classList.contains('flow-block--hidden')) return;
    row.classList.remove('flow-block--hidden');
    gsap.fromTo(row, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
  }

  function hideRow(id) {
    const row = $(id);
    if (row && !row.classList.contains('flow-block--hidden')) row.classList.add('flow-block--hidden');
  }

  function getMinRange() {
    const svcCount = state.services.filter(s => !skipServices.includes(s)).length;
    const modCount = state.modules.length;

    // Score = services x 2 + modules
    // 1 service + 1 module = 3, 2 services + 5 modules = 9
    const score = svcCount * 2 + modCount;

    if (score <= 3) return 0;   // < 1 000 € — 1 service + 1 module
    if (score <= 6) return 1;   // 1 000 - 3 000 € — 1 service + 2-4 modules
    if (score <= 10) return 2;  // 3 000 - 7 000 € — 1-2 services + a few modules
    if (score <= 16) return 3;  // 7 000 - 15 000 € — 2 services + many modules
    return 4;                   // 15 000 €+ — large multi-service project
  }

  function updateSliderTrack() {
    const s = $('brief-slider');
    const pct = ((+s.value - +s.min) / (+s.max - +s.min)) * 100;
    s.style.background = `linear-gradient(90deg, var(--color-accent) 0%, var(--color-accent-hover) ${pct}%, rgba(139,92,246,0.15) ${pct}%)`;
  }

  // ========== Render module buttons ==========
  function renderModules() {
    const container = $('br-modules');
    container.innerHTML = '';
    const available = [];
    state.services.forEach(svc => {
      (moduleData[svc] || []).forEach(mod => { if (!available.find(m => m.id === mod.id)) available.push(mod); });
    });

    if (!available.length) {
      hideRow('br-modules-row');
      return;
    }

    showRow('br-modules-row');
    available.forEach(mod => {
      const btn = document.createElement('button');
      btn.className = 'flow-module';
      btn.type = 'button';
      btn.innerHTML = `<span class="flow-module-label">${mod.label}</span><span class="flow-module-desc">${mod.desc}</span>`;
      if (state.modules.includes(mod.id)) btn.classList.add('is-selected');
      btn.addEventListener('click', () => {
        btn.classList.toggle('is-selected');
        bounce(btn);
        if (state.modules.includes(mod.id)) state.modules = state.modules.filter(m => m !== mod.id);
        else state.modules.push(mod.id);
        // Auto-adjust budget to match selection
        const slider = $('brief-slider');
        const minR = getMinRange();
        state.budgetRange = minR;
        slider.value = minR;
        refresh();
      });
      container.appendChild(btn);
    });
  }

  // ========== Refresh visibility and hints ==========
  function refresh() {
    const isProject = state.intent === 'project';
    const isMission = state.intent === 'mission';
    const isSkip = state.services.length > 0 && state.services.every(s => skipServices.includes(s));

    // Project flow
    if (isProject) {
      showRow('br-type-row');
      if (state.services.length > 0 && !isSkip) {
        renderModules();
        if (state.modules.length > 0) { showRow('br-budget-row'); } else { hideRow('br-budget-row'); hideRow('br-timeline-row'); hideRow('flow-contact'); }
        if (state.modules.length > 0) { showRow('br-timeline-row'); } else { hideRow('br-timeline-row'); hideRow('flow-contact'); }
        if (state.timeline) { showRow('flow-contact'); buildProjectBrief(); } else { hideRow('flow-contact'); }
      } else if (isSkip) {
        hideRow('br-modules-row'); hideRow('br-budget-row'); hideRow('br-timeline-row');
        showRow('flow-contact');      } else {
        hideRow('br-modules-row'); hideRow('br-budget-row'); hideRow('br-timeline-row'); hideRow('flow-contact');
      }
    } else {
      hideRow('br-type-row'); hideRow('br-modules-row'); hideRow('br-budget-row'); hideRow('br-timeline-row');
    }

    // Mission flow
    if (isMission) {
      showRow('br-mtype-row');
      if (state.mType) showRow('br-mcadre-row'); else { hideRow('br-mcadre-row'); hideRow('br-mduree-row'); hideRow('br-mremote-row'); hideRow('flow-contact'); }
      if (state.mCadre && state.mCadre !== 'cdi') showRow('br-mduree-row'); else hideRow('br-mduree-row');
      if (state.mCadre === 'cdi' || state.mDuree) showRow('br-mremote-row'); else hideRow('br-mremote-row');
      if (state.mRemote) { showRow('flow-contact'); } else { hideRow('flow-contact'); }
    } else {
      hideRow('br-mtype-row'); hideRow('br-mcadre-row'); hideRow('br-mduree-row'); hideRow('br-mremote-row');
    }

    if (!isProject && !isMission) hideRow('flow-contact');

    // Budget display
    $('brief-slider-label').textContent = budgetRanges[state.budgetRange];
    updateSliderTrack();

    // Hint
    const hint = $('brief-hint');
    if (isProject && state.modules.length > 0) {
      const r = state.budgetRange, n = state.modules.length;
      const min = getMinRange();
      if (r < min) { hint.textContent = `${n} fonctionnalités — cette fourchette est serrée.`; hint.classList.add('is-warning'); }
      else { hint.textContent = 'Fourchette indicative — le budget définitif est discuté ensemble.'; hint.classList.remove('is-warning'); }
    } else {
      hint.textContent = '';
      hint.classList.remove('is-warning');
    }

    // Easter egg

    // Easter egg
    if (state.budgetRange >= 4) {
      const v = $('brief-slider-label');
      if (!v.dataset.egged) { v.dataset.egged = '1'; gsap.fromTo(v, { scale: 1.15 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' }); }
    } else { $('brief-slider-label').dataset.egged = ''; }
  }

  // ========== Setup clickable tag groups ==========
  function setupTags(selector, attr, stateKey, mode, onSelect) {
    doc.querySelectorAll(selector).forEach(tag => {
      tag.addEventListener('click', () => {
        if (mode === 'single') {
          doc.querySelectorAll(selector).forEach(t => t.classList.remove('is-selected'));
          tag.classList.add('is-selected');
          state[stateKey] = tag.dataset[attr];
        } else {
          tag.classList.toggle('is-selected');
          const val = tag.dataset[attr];
          if (state[stateKey].includes(val)) {
            state[stateKey] = state[stateKey].filter(v => v !== val);
            // Remove orphaned modules
            if (stateKey === 'services') {
              const rm = (moduleData[val] || []).map(m => m.id);
              state.modules = state.modules.filter(m => !rm.includes(m));
            }
          } else {
            state[stateKey].push(val);
          }
        }
        bounce(tag);
        if (onSelect) onSelect();
        refresh();
      });
    });
  }

  // Intent
  setupTags('[data-intent]', 'intent', 'intent', 'single', () => {
    // Reset the other flow
    if (state.intent === 'project') { state.mType = null; state.mCadre = null; state.mDuree = null; state.mRemote = null; doc.querySelectorAll('[data-mt],[data-mc],[data-md],[data-mr]').forEach(t => t.classList.remove('is-selected')); }
    else { state.services = []; state.modules = []; state.timeline = null; doc.querySelectorAll('[data-svc]').forEach(t => t.classList.remove('is-selected')); doc.querySelectorAll('#br-timeline .brief-tag').forEach(t => t.classList.remove('is-selected')); }
  });

  // Services (multi-select) — cards
  setupTags('[data-svc]', 'svc', 'services', 'multi');

  // Timeline (single)
  setupTags('[data-tl]', 'tl', 'timeline', 'single');

  // Mission
  setupTags('[data-mt]', 'mt', 'mType', 'single');
  setupTags('[data-mc]', 'mc', 'mCadre', 'single', () => {
    if (state.mCadre === 'cdi') { state.mDuree = 'cdi'; }
    else { state.mDuree = null; doc.querySelectorAll('[data-md]').forEach(t => t.classList.remove('is-selected')); }
  });
  setupTags('[data-md]', 'md', 'mDuree', 'single');
  setupTags('[data-mr]', 'mr', 'mRemote', 'single');

  // Slider
  const slider = $('brief-slider');
  slider.addEventListener('input', () => { state.budgetRange = +slider.value; refresh(); });
  updateSliderTrack();

  // ========== Submit ==========
  let lastSubmit = 0;
  $('brief-submit').addEventListener('click', async () => {
    if (Date.now() - lastSubmit < 30000) return; // 30s rate limit
    const btn = $('brief-submit');
    const name = $('brief-name').value.trim(), email = $('brief-email').value.trim();
    if (!name || !email) { gsap.to(btn, { x: -6, duration: 0.08, repeat: 5, yoyo: true, ease: 'power2.inOut' }); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { $('brief-email').focus(); gsap.to(btn, { x: -6, duration: 0.08, repeat: 5, yoyo: true, ease: 'power2.inOut' }); return; }
    if (!$('brief-consent').checked) { gsap.to(btn, { x: -6, duration: 0.08, repeat: 5, yoyo: true, ease: 'power2.inOut' }); return; }
    const turnstileToken = document.querySelector('[name="cf-turnstile-response"]')?.value;
    if (!turnstileToken) { gsap.to(btn, { x: -6, duration: 0.08, repeat: 5, yoyo: true, ease: 'power2.inOut' }); return; }

    const orig = btn.textContent;
    btn.disabled = true;
    btn.textContent = '...';

    const formData = {
      access_key: '9682f3cd-cb66-4805-809b-4d310a042c79',
      subject: `AM Labs · Nouveau ${state.intent === 'mission' ? 'contact mission' : 'brief projet'}`,
      from_name: name,
      email,
      message: $('brief-message').value.trim(),
      intent: state.intent,
    };

    if (state.intent === 'project') {
      formData.services = state.services.join(', ');
      formData.modules = state.modules.join(', ');
      formData.budget = budgetRanges[state.budgetRange] || '';
      formData.delai = state.timeline || 'Non précisé';
    } else {
      formData.profil = state.mType || '';
      formData.cadre = state.mCadre || '';
      formData.duree = state.mDuree || '';
      formData.organisation = state.mRemote || '';
    }

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      lastSubmit = Date.now();
      if (data.success) {
        gsap.timeline()
          .to(btn, { opacity: 0, y: -10, duration: 0.2, ease: 'power2.in' })
          .call(() => { btn.textContent = 'C\'est parti ! Réponse sous 24h.'; btn.style.background = 'var(--color-success)'; })
          .to(btn, { opacity: 1, y: 0, duration: 0.3, ease: 'power3.out' })
          .to(btn, { duration: 3 })
          .call(() => {
            btn.textContent = orig; btn.style.background = ''; btn.disabled = false; gsap.set(btn, { clearProps: 'all' });
            // Reset form
            $('brief-name').value = '';
            $('brief-email').value = '';
            $('brief-message').value = '';
            state.intent = null; state.services = []; state.modules = []; state.budgetRange = 0; state.timeline = null;
            state.mType = null; state.mCadre = null; state.mDuree = null; state.mRemote = null;
            doc.querySelectorAll('.is-selected').forEach(el => el.classList.remove('is-selected'));
            ['br-type-row', 'br-modules-row', 'br-budget-row', 'br-timeline-row', 'br-mtype-row', 'br-mcadre-row', 'br-mduree-row', 'br-mremote-row', 'flow-contact'].forEach(id => {
              const el = $(id);
              if (el) el.classList.add('flow-block--hidden');
            });
          });
      } else {
        btn.textContent = 'Erreur. Réessayez.';
        btn.style.background = '#e74c3c';
        setTimeout(() => { btn.textContent = orig; btn.style.background = ''; btn.disabled = false; }, 3000);
      }
    } catch {
      btn.textContent = 'Erreur réseau. Réessayez.';
      btn.style.background = '#e74c3c';
      setTimeout(() => { btn.textContent = orig; btn.style.background = ''; btn.disabled = false; }, 3000);
    }
  });
}
