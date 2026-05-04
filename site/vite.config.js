import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    port: 3000,
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      input: {
        // Home (toujours active)
        main: resolve(__dirname, 'index.html'),

        // Pages à décommenter au fur et à mesure de leur création (batch 2 → 6)

        // Page locale
        agenceWebMontelimar: resolve(__dirname, 'agence-web-montelimar/index.html'),

        // Services
        creationSiteWeb: resolve(__dirname, 'services/creation-site-web/index.html'),
        applicationSurMesure: resolve(__dirname, 'services/application-sur-mesure/index.html'),
        connecteurErpEcommerce: resolve(__dirname, 'services/connecteur-erp-ecommerce/index.html'),
        auditSeoNumerique: resolve(__dirname, 'services/audit-seo-numerique/index.html'),
        maintenanceSiteWeb: resolve(__dirname, 'services/maintenance-site-web/index.html'),

        // Réalisations
        atelierClamart: resolve(__dirname, 'realisations/atelier-clamart/index.html'),
        toolInnovationPanama: resolve(__dirname, 'realisations/tool-innovation-panama/index.html'),

        // Pages institutionnelles
        aPropos: resolve(__dirname, 'a-propos/index.html'),
        contact: resolve(__dirname, 'contact/index.html'),
        mentionsLegales: resolve(__dirname, 'mentions-legales/index.html'),
      },
    },
  },
});
