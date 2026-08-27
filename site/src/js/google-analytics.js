export const GOOGLE_ANALYTICS_MEASUREMENT_ID = 'G-SQ5Z2TRPKT';

export function installGoogleAnalytics(doc, win) {
  if (doc.querySelector('script[data-google-analytics]')) return false;

  const script = doc.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_MEASUREMENT_ID}`;
  script.dataset.googleAnalytics = 'true';
  doc.head.append(script);

  win.dataLayer = win.dataLayer || [];
  win.gtag = win.gtag || function gtag() {
    win.dataLayer.push(arguments);
  };
  win.gtag('js', new Date());
  win.gtag('config', GOOGLE_ANALYTICS_MEASUREMENT_ID, {
    allow_ad_personalization_signals: false,
    allow_google_signals: false,
    cookie_expires: 33696000,
  });

  return true;
}
