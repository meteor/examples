import { onPageLoad } from 'meteor/server-render';

import { DESCRIPTION, KEYWORDS, LOGO_URL_WITHOUT_EXT, NAME } from './constants';
import { getPwaSettings } from './pwa-json';
import { APPLE_ITUNES_APP_ID } from './native';

const getBaseUrlFromHeaders = headers => {
  const protocol = headers['x-forwarded-proto'];
  const { host } = headers;
  return `${protocol ? `${protocol}:` : ''}//${host}`;
};

const getContext = sink => {
  const { headers, url, browser } = sink.request;
  const baseUrl = getBaseUrlFromHeaders(headers);

  if (browser && browser.name === 'galaxybot') return null;
  if (url && url.pathname && url.pathname.includes('cordova/')) return null;

  try {
    return { baseUrl };
  } catch (e) {
    console.error(`Error trying to get details from URL ${url.path}`, e);
    return { baseUrl };
  }
};

const appendMetaTags = (sink, tags) => {
  for (const [key, value] of Object.entries(tags)) {
    if (!value) continue;
    switch (key) {
      case 'title':
        sink.appendToHead(`<title>${value}</title>\n`);
        sink.appendToHead(`<meta property="og:title" content="${value}">\n`);
        break;
      case 'description':
        sink.appendToHead(`<meta property="description" content="${value}">\n`);
        sink.appendToHead(`<meta property="og:description" content="${value}">\n`);
        break;
      case 'image':
        sink.appendToHead(`<meta property="og:image" content="${value}">\n`);
        break;
      case 'url':
        sink.appendToHead(`<meta property="og:url" content="${value}">\n`);
        break;
      case 'keywords':
        sink.appendToHead(`<meta name="keywords" content="${value}">\n`);
        break;
      default:
        sink.appendToHead(`<meta property="${key}" content="${value}">\n`);
    }
  }
};

const appendAppTags = (sink, { baseUrl } = {}) => {
  const { name, theme_color: themeColor, icons } = getPwaSettings();
  const iconUrl = icons && icons.length && icons[0].src;

  if (APPLE_ITUNES_APP_ID) {
    sink.appendToHead(
      `<meta name="apple-itunes-app" content="app-id=${APPLE_ITUNES_APP_ID}, app-argument=${baseUrl}">\n`
    );
  }
  sink.appendToHead(`<meta name="apple-mobile-web-app-title" content="${name}">\n`);
  sink.appendToHead('<meta name="apple-mobile-web-app-status-bar-style" content="default">\n');
  sink.appendToHead(`<meta name="theme-color" content="${themeColor}">\n`);
  if (iconUrl) {
    sink.appendToHead(`<link rel="apple-touch-icon" href="${iconUrl}">\n`);
  }
};

onPageLoad(sink => {
  try {
    const context = getContext(sink);
    if (!context) return;

    const tags = {
      title: NAME,
      description: DESCRIPTION,
      image: `${LOGO_URL_WITHOUT_EXT}.png`,
      url: context.baseUrl,
      keywords: KEYWORDS.filter(Boolean).join(', '),
    };
    appendMetaTags(sink, tags);
    appendAppTags(sink, context);
  } catch (e) {
    console.error('Error trying to generate initial HTML', e);
  }
});
