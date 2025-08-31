
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'collectLinks') {
    const origin = location.origin;
    const visited = new Set();
    const toVisit = [location.href];
    const allLinks = new Set();

    function crawl(url, depth = 0, maxDepth = 2) {
      return fetch(url)
        .then(res => res.text())
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const anchors = Array.from(doc.querySelectorAll('a'));
          const links = anchors
            .map(a => a.href)
            .filter(href => href.startsWith(origin));
          links.forEach(link => {
            if (!visited.has(link)) {
              toVisit.push(link);
              allLinks.add(link);
            }
          });
        })
        .catch(err => {
          // Log errors for debugging
          console.log('Crawl error:', url, err);
        });
    }

    async function startCrawl() {
      let idx = 0;
      while (idx < toVisit.length && idx < 100) { // Limit to 100 pages
        const url = toVisit[idx];
        if (!visited.has(url)) {
          visited.add(url);
          await crawl(url);
        }
        idx++;
      }
      sendResponse({ links: Array.from(allLinks) });
    }

    startCrawl();
    return true;
  }
});
