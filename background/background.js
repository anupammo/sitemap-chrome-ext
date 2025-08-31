importScripts('../scripts/sitemapChecker.js');
importScripts('../scripts/sitemapGenerator.js');
importScripts('../scripts/downloader.js');

let cachedLinks = [];

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  const url = new URL(msg.url || sender.tab.url);
  const domain = url.origin;

  if (msg.action === 'checkSitemap') {
    const result = await checkSitemap(domain);
    sendResponse(result);

    if (!result.exists) {
      chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        files: ['utils/linkCollector.js']
      }, () => {
        chrome.tabs.sendMessage(sender.tab.id, { action: 'collectLinks' }, (response) => {
          cachedLinks = response.links;
        });
      });
    }
  }

  if (msg.action === 'downloadXML') {
    const xml = generateXML(cachedLinks);
    downloadFile(xml, 'sitemap.xml', 'application/xml');
  }

  if (msg.action === 'downloadHTML') {
    const html = generateHTML(cachedLinks);
    downloadFile(html, 'sitemap.html', 'text/html');
  }

  return true;
});
