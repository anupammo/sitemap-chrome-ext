importScripts('../scripts/sitemapChecker.js');
importScripts('../scripts/sitemapGenerator.js');
importScripts('../scripts/downloader.js');

let cachedLinks = [];

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  let tabUrl = msg.url;
  let tabId = undefined;
  if (sender.tab) {
    tabUrl = tabUrl || sender.tab.url;
    tabId = sender.tab.id;
  }
  if (!tabUrl) {
    // If no URL is available, abort and respond with error
    sendResponse({ exists: false, error: 'No tab URL available.' });
    return;
  }
  const url = new URL(tabUrl);
  const domain = url.origin;

  if (msg.action === 'checkSitemap') {
    (async () => {
      const result = await checkSitemap(domain);
      sendResponse(result);

      if (!result.exists && tabId !== undefined) {
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['utils/linkCollector.js']
        }, () => {
          chrome.tabs.sendMessage(tabId, { action: 'collectLinks' }, (response) => {
            if (response && response.links) {
              cachedLinks = response.links;
            } else {
              cachedLinks = [];
            }
          });
        });
      }
    })();
    return true; // Keep the port open for async sendResponse
  }

  if (msg.action === 'downloadXML') {
    if (cachedLinks && cachedLinks.length > 0) {
      const xml = generateXML(cachedLinks);
      downloadFile(xml, 'sitemap.xml', 'application/xml');
    }
    // No response needed
  }

  if (msg.action === 'downloadHTML') {
    if (cachedLinks && cachedLinks.length > 0) {
      const html = generateHTML(cachedLinks);
      downloadFile(html, 'sitemap.html', 'text/html');
    }
    // No response needed
  }

  if (msg.action === 'getLinks') {
    sendResponse({ links: cachedLinks });
    return;
  }

  // For non-async actions, no need to keep the port open
});
