// Deep crawl all internal links recursively
async function deepCrawlLinks(startUrl, maxPages = 100) {
  const origin = new URL(startUrl).origin;
  const visited = new Set();
  const toVisit = [startUrl];
  const allLinks = new Set();

  while (toVisit.length > 0 && visited.size < maxPages) {
    const url = toVisit.shift();
    if (visited.has(url)) continue;
    visited.add(url);
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const links = Array.from(doc.querySelectorAll('a'))
        .map(a => a.href)
        .filter(href => href.startsWith(origin));
      for (const link of links) {
        if (!visited.has(link) && !toVisit.includes(link)) {
          toVisit.push(link);
        }
        allLinks.add(link);
      }
    } catch (e) {
      // Ignore fetch errors
    }
  }
  return Array.from(allLinks);
}


chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'collectLinks') {
    window.scrollTo(0, document.body.scrollHeight);
    setTimeout(() => {
      const origin = location.origin;
      // Collect links from header
      const headerLinks = Array.from(document.querySelectorAll('header a'))
        .map(a => a.href)
        .filter(href => href.startsWith(origin));
      // Collect links from footer
      const footerLinks = Array.from(document.querySelectorAll('footer a'))
        .map(a => a.href)
        .filter(href => href.startsWith(origin));
      // Collect links from body (excluding header/footer)
      const bodyLinks = Array.from(document.querySelectorAll('body a'))
        .map(a => a.href)
        .filter(href => href.startsWith(origin));

      // Remove duplicates and categorize
      const uniqueHeader = [...new Set(headerLinks)];
      const uniqueFooter = [...new Set(footerLinks)];
      // Remove header/footer links from bodyLinks
      const uniqueBody = [...new Set(bodyLinks.filter(l => !uniqueHeader.includes(l) && !uniqueFooter.includes(l)))];

      // All unique links
      const allLinks = [...new Set([...uniqueHeader, ...uniqueFooter, ...uniqueBody])];

      console.log('Header links:', uniqueHeader);
      console.log('Footer links:', uniqueFooter);
      console.log('Body links:', uniqueBody);
      sendResponse({
        header: uniqueHeader,
        footer: uniqueFooter,
        body: uniqueBody,
        all: allLinks
      });
    }, 3000);
    return true;
  } else if (msg.action === 'deepCrawlLinks') {
    deepCrawlLinks(msg.startUrl, msg.maxPages || 100).then(allLinks => {
      sendResponse({ all: allLinks });
    });
    return true;
  }
});
