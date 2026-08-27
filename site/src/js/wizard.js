/**
 * Brief — interactive project document
 * Everything on one screen, inline selections, zero steps
 */

const doc = document.getElementById('brief-doc');
if (doc) {

  const $ = id => document.getElementById(id);
  const state = { intent: null, services: [], modules: [], budgetRange: null, timeline: null, mType: null, mCadre: null, mDuree: null, mRemote: null };

  const EN = document.documentElement.lang === 'en';

  const moduleData = EN ? {
    app: [
      { id: 'dashboard', label: 'Dashboard', desc: 'KPIs, metrics, reporting' },
      { id: 'users', label: 'Users', desc: 'Accounts, roles, permissions' },
      { id: 'automation', label: 'Automation', desc: 'Workflows, scheduled tasks' },
      { id: 'ai-assistant', label: 'AI assistant', desc: 'Built into the application' },
      { id: 'api', label: 'API', desc: 'Connect your existing tools' },
      { id: 'admin', label: 'Back office', desc: 'Management interface' },
      { id: 'notifs', label: 'Notifications', desc: 'Emails, alerts, reminders' },
    ],
    connector: [
      { id: 'sync', label: 'Sync', desc: 'Real-time data' },
      { id: 'monitoring', label: 'Monitoring', desc: 'Sync status, alerts' },
      { id: 'webhooks', label: 'Webhooks', desc: 'Real-time events' },
      { id: 'reconciliation', label: 'Reconciliation', desc: 'Conflict resolution' },
    ],
    site: [
      { id: 'design', label: 'Design', desc: 'A visual identity of your own' },
      { id: 'payment', label: 'Payments', desc: 'Stripe, cards, invoicing' },
      { id: 'client-area', label: 'Client area', desc: 'Accounts, history, profile' },
      { id: 'backoffice', label: 'Back office', desc: 'Content and order management' },
      { id: 'seo', label: 'SEO', desc: 'Search-engine optimized' },
      { id: 'newsletter', label: 'Newsletter', desc: 'Emails, automation' },
      { id: 'ai-search', label: 'AI search', desc: 'Products, content, support' },
      { id: 'ai-content', label: 'AI content', desc: 'Pages, listings, descriptions' },
    ],
    automation: [
      { id: 'workflows', label: 'Workflows', desc: 'Automated multi-step tasks' },
      { id: 'document-generation', label: 'Documents', desc: 'Quotes, reports, PDFs' },
      { id: 'email-workflows', label: 'Emails', desc: 'Follow-ups, replies, alerts' },
      { id: 'tool-integration', label: 'Integrations', desc: 'Data flowing between tools' },
      { id: 'ai-processing', label: 'AI processing', desc: 'Sort, extract, summarize' },
    ],
    ai: [
      { id: 'knowledge-search', label: 'Knowledge search', desc: 'Answers from your documents' },
      { id: 'content-drafting', label: 'Content drafting', desc: 'Replies, quotes, listings' },
      { id: 'document-analysis', label: 'Document analysis', desc: 'Extract and summarize' },
      { id: 'request-sorting', label: 'Request sorting', desc: 'Classify and prioritize' },
      { id: 'tool-actions', label: 'Actions in tools', desc: 'Prepare or run operations' },
      { id: 'human-validation', label: 'Human approval', desc: 'You keep final control' },
    ],
    web3: [
      { id: 'chain-data', label: 'On-chain analytics', desc: 'Blockchain data extraction' },
      { id: 'wallet-tracking', label: 'Wallet tracking', desc: 'Wallet monitoring, patterns' },
      { id: 'token-tools', label: 'Token tools', desc: 'Analysis, filtering, alerts' },
      { id: 'web3-integration', label: 'Web3 integration', desc: 'Blockchain inside an app' },
    ],
  } : {
    app: [
      { id: 'dashboard', label: 'Dashboard', desc: 'Tableaux de bord, métriques' },
      { id: 'users', label: 'Utilisateurs', desc: 'Comptes, rôles, droits' },
      { id: 'automation', label: 'Automatisations', desc: 'Workflows, tâches auto' },
      { id: 'ai-assistant', label: 'Assistant IA', desc: "Intégré à l'application" },
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
      { id: 'ai-search', label: 'Recherche IA', desc: 'Produits, contenus, assistance' },
      { id: 'ai-content', label: 'Contenus par IA', desc: 'Pages, fiches, descriptions' },
    ],
    automation: [
      { id: 'workflows', label: 'Workflows', desc: 'Tâches automatiques en chaîne' },
      { id: 'document-generation', label: 'Documents', desc: 'Devis, rapports, PDF' },
      { id: 'email-workflows', label: 'Emails', desc: 'Relances, réponses, alertes' },
      { id: 'tool-integration', label: 'Intégrations', desc: 'Données entre vos outils' },
      { id: 'ai-processing', label: 'Traitement par IA', desc: 'Trier, extraire, résumer' },
    ],
    ai: [
      { id: 'knowledge-search', label: 'Recherche documentaire', desc: 'Réponses depuis vos documents' },
      { id: 'content-drafting', label: 'Préparation de contenus', desc: 'Réponses, devis, fiches' },
      { id: 'document-analysis', label: 'Analyse de documents', desc: 'Extraire et résumer' },
      { id: 'request-sorting', label: 'Tri des demandes', desc: 'Classer et prioriser' },
      { id: 'tool-actions', label: 'Actions dans vos outils', desc: 'Préparer ou exécuter' },
      { id: 'human-validation', label: 'Validation humaine', desc: 'Vous gardez le contrôle' },
    ],
    web3: [
      { id: 'chain-data', label: 'Analyse on-chain', desc: 'Extraction données blockchain' },
      { id: 'wallet-tracking', label: 'Tracking wallets', desc: 'Suivi de wallets, patterns' },
      { id: 'token-tools', label: 'Outils tokens', desc: 'Analyse, filtrage, alertes' },
      { id: 'web3-integration', label: 'Intégration Web3', desc: 'Blockchain dans une app' },
    ],
  };

  const budgetRanges = EN
    ? {
        unknown: "Let's define it together",
        lt3: 'Under €3,000',
        '3-7': '€3,000 to €7,000',
        '7-15': '€7,000 to €15,000',
        '15-30': '€15,000 to €30,000',
        '30plus': 'Over €30,000',
      }
    : {
        unknown: 'À définir ensemble',
        lt3: 'Moins de 3 000 €',
        '3-7': '3 000 à 7 000 €',
        '7-15': '7 000 à 15 000 €',
        '15-30': '15 000 à 30 000 €',
        '30plus': 'Plus de 30 000 €',
      };
  const skipServices = ['other', 'conseil'];

  function showRow(id) {
    const row = $(id);
    if (!row || !row.classList.contains('flow-block--hidden')) return;
    row.classList.remove('flow-block--hidden');
  }

  function hideRow(id) {
    const row = $(id);
    if (row && !row.classList.contains('flow-block--hidden')) row.classList.add('flow-block--hidden');
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
        if (state.modules.includes(mod.id)) state.modules = state.modules.filter(m => m !== mod.id);
        else state.modules.push(mod.id);
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
        if (state.budgetRange) { showRow('br-timeline-row'); } else { hideRow('br-timeline-row'); hideRow('flow-contact'); }
        if (state.budgetRange && state.timeline) { showRow('flow-contact'); } else { hideRow('flow-contact'); }
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
        if (onSelect) onSelect();
        refresh();
      });
    });
  }

  // Intent
  setupTags('[data-intent]', 'intent', 'intent', 'single', () => {
    // Reset the other flow
    if (state.intent === 'project') { state.mType = null; state.mCadre = null; state.mDuree = null; state.mRemote = null; doc.querySelectorAll('[data-mt],[data-mc],[data-md],[data-mr]').forEach(t => t.classList.remove('is-selected')); }
    else {
      state.services = [];
      state.modules = [];
      state.budgetRange = null;
      state.timeline = null;
      doc.querySelectorAll('[data-svc],[data-budget],[data-tl]').forEach(t => t.classList.remove('is-selected'));
    }
  });

  // Services (multi-select) — cards
  setupTags('[data-svc]', 'svc', 'services', 'multi');

  // Budget (single)
  setupTags('[data-budget]', 'budget', 'budgetRange', 'single');

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

  // ========== Submit ==========
  let lastSubmit = 0;
  $('brief-submit').addEventListener('click', async () => {
    if (Date.now() - lastSubmit < 30000) return; // 30s rate limit
    const btn = $('brief-submit');
    const name = $('brief-name').value.trim(), email = $('brief-email').value.trim();
    if (!name) { $('brief-name').focus(); return; }
    if (!email) { $('brief-email').focus(); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { $('brief-email').focus(); return; }
    if (!$('brief-consent').checked) { $('brief-consent').focus(); return; }
    const turnstileToken = document.querySelector('[name="cf-turnstile-response"]')?.value;
    if (!turnstileToken) { btn.focus(); return; }

    const orig = btn.textContent;
    btn.disabled = true;
    btn.textContent = '...';

    const formData = {
      access_key: '9682f3cd-cb66-4805-809b-4d310a042c79',
      subject: `AM Labs · Nouveau ${state.intent === 'mission' ? 'contact mission' : 'brief projet'}${EN ? ' (site EN)' : ''}`,
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
        btn.textContent = EN ? 'Sent! You\'ll hear back within 24h.' : 'C\'est parti ! Réponse sous 24h.';
        btn.style.background = 'var(--color-success)';
        setTimeout(() => {
          btn.textContent = orig;
          btn.style.background = '';
          btn.disabled = false;
          // Reset form
          $('brief-name').value = '';
          $('brief-email').value = '';
          $('brief-message').value = '';
          state.intent = null; state.services = []; state.modules = []; state.budgetRange = null; state.timeline = null;
          state.mType = null; state.mCadre = null; state.mDuree = null; state.mRemote = null;
          doc.querySelectorAll('.is-selected').forEach(el => el.classList.remove('is-selected'));
          ['br-type-row', 'br-modules-row', 'br-budget-row', 'br-timeline-row', 'br-mtype-row', 'br-mcadre-row', 'br-mduree-row', 'br-mremote-row', 'flow-contact'].forEach(id => {
            const el = $(id);
            if (el) el.classList.add('flow-block--hidden');
          });
        }, 3000);
      } else {
        btn.textContent = EN ? 'Error. Please try again.' : 'Erreur. Réessayez.';
        btn.style.background = '#e74c3c';
        setTimeout(() => { btn.textContent = orig; btn.style.background = ''; btn.disabled = false; }, 3000);
      }
    } catch {
      btn.textContent = EN ? 'Network error. Please try again.' : 'Erreur réseau. Réessayez.';
      btn.style.background = '#e74c3c';
      setTimeout(() => { btn.textContent = orig; btn.style.background = ''; btn.disabled = false; }, 3000);
    }
  });
}
