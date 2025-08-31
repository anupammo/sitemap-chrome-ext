document.getElementById('checkSitemap').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.runtime.sendMessage({ action: 'checkSitemap', url: tab.url }, (response) => {
    const resultDiv = document.getElementById('result');
    if (response.exists) {
      resultDiv.textContent = `Sitemap found at ${response.source}`;
    } else {
      resultDiv.textContent = 'No sitemap found. Crawling...';
      document.getElementById('downloads').style.display = 'block';
    }
  });
});

document.getElementById('downloadXML').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'downloadXML' });
});

document.getElementById('downloadHTML').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'downloadHTML' });
});
