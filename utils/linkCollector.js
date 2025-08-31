chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'collectLinks') {
    const anchors = Array.from(document.querySelectorAll('a'));
    const origin = location.origin;
    const links = anchors
      .map(a => a.href)
      .filter(href => href.startsWith(origin))
      .filter((v, i, a) => a.indexOf(v) === i);

    sendResponse({ links });
    return true;
  }
});
