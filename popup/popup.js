import { downloadFile } from '../modules/downloader.js';
import { checkSitemap } from '../modules/sitemapChecker.js';
import { generateXML, generateHTML } from '../modules/sitemapGenerator.js';

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const checkSitemapBtn = document.getElementById('checkSitemap');
  const buttonText = document.getElementById('button-text');
  const buttonSpinner = document.getElementById('button-spinner');
  const progressBar = document.querySelector('.progress-bar');
  const progressFill = document.querySelector('.progress-fill');
  const resultContainer = document.querySelector('.result-container');
  const statusBadge = document.getElementById('status-badge');
  const resultMessage = document.getElementById('result-message');
  const urlList = document.getElementById('url-list');
  const downloadsDiv = document.getElementById('downloads');
  const downloadXMLBtn = document.getElementById('downloadXML');
  const downloadHTMLBtn = document.getElementById('downloadHTML');

  // Initial UI state
  if (resultContainer) resultContainer.style.display = 'none';
  if (progressBar) progressBar.style.display = 'none';
  if (downloadsDiv) downloadsDiv.classList.remove('downloads-visible');
  if (downloadXMLBtn) downloadXMLBtn.disabled = true;
  if (downloadHTMLBtn) downloadHTMLBtn.disabled = true;
  if (urlList) urlList.style.display = 'none';

  function setStatus(text, type = 'secondary') {
    if (!statusBadge) return;
    statusBadge.textContent = text;
    statusBadge.className = 'status-badge';
    if (type === 'success') statusBadge.classList.add('status-success');
    else if (type === 'error') statusBadge.classList.add('status-error');
    else if (type === 'warning') statusBadge.classList.add('status-warning');
  }

  function showSpinner(show) {
    if (!buttonSpinner || !buttonText) return;
    buttonSpinner.style.display = show ? 'inline-block' : 'none';
    buttonText.style.display = show ? 'none' : 'inline';
  }

  function showProgress(percent) {
    if (!progressBar || !progressFill) return;
    progressBar.style.display = 'block';
    progressFill.style.width = percent + '%';
  }

  function hideProgress() {
    if (!progressBar || !progressFill) return;
    progressBar.style.display = 'none';
    progressFill.style.width = '0%';
  }

  function showDownloads(show) {
    if (!downloadsDiv) return;
    if (show) downloadsDiv.classList.add('downloads-visible');
    else downloadsDiv.classList.remove('downloads-visible');
  }

  function showResultContainer(show) {
    if (!resultContainer) return;
    resultContainer.style.display = show ? 'block' : 'none';
  }

  function showUrlList(links) {
    if (!urlList) return;
    urlList.innerHTML = '';
    if (!links || links.length === 0) {
      urlList.style.display = 'none';
      return;
    }
    links.forEach(link => {
      const li = document.createElement('li');
      li.className = 'url-item';
      const a = document.createElement('a');
      a.className = 'url-link';
      a.href = link;
      a.textContent = link;
      a.target = '_blank';
      li.appendChild(a);
      urlList.appendChild(li);
    });
    urlList.style.display = 'block';
  }

  if (checkSitemapBtn) {
    checkSitemapBtn.addEventListener('click', async () => {
      showSpinner(true);
      showResultContainer(true);
      setStatus('Checking...', 'secondary');
      if (resultMessage) resultMessage.textContent = '';
      if (urlList) urlList.style.display = 'none';
      hideProgress();
      showDownloads(false);
      if (downloadXMLBtn) downloadXMLBtn.disabled = true;
      if (downloadHTMLBtn) downloadHTMLBtn.disabled = true;

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      chrome.runtime.sendMessage({ action: 'checkSitemap', url: tab.url }, (response) => {
        showSpinner(false);
        if (!response) {
          setStatus('Error', 'error');
          if (resultMessage) resultMessage.textContent = 'No response from background script.';
          return;
        }
        if (response.exists) {
          setStatus('Sitemap Found', 'success');
          if (resultMessage) resultMessage.innerHTML = `Sitemap found at <a href="${response.source}" target="_blank">${response.source}</a>`;
          if (urlList) urlList.style.display = 'none';
          showDownloads(true);
          if (downloadXMLBtn) {
            downloadXMLBtn.style.display = '';
            downloadXMLBtn.disabled = false;
            downloadXMLBtn.textContent = 'View XML Sitemap';
            downloadXMLBtn.onclick = () => {
              window.open(response.source, '_blank');
            };
          }
          if (downloadHTMLBtn) {
            downloadHTMLBtn.style.display = '';
            downloadHTMLBtn.disabled = false;
            downloadHTMLBtn.textContent = 'View HTML Sitemap';
            downloadHTMLBtn.onclick = () => {
              const htmlUrl = response.source.replace(/sitemap\.xml$/, 'sitemap.html');
              window.open(htmlUrl, '_blank');
            };
          }
        } else {
          setStatus('No Sitemap', 'warning');
          if (resultMessage) resultMessage.innerHTML = 'No sitemap found. Crawling all internal pages...';
          showProgress(30);
          chrome.tabs.sendMessage(tab.id, { action: 'deepCrawlLinks', startUrl: tab.url, maxPages: 500 }, (crawlResponse) => {
            hideProgress();
            if (chrome.runtime.lastError) {
              setStatus('Error', 'error');
              if (resultMessage) resultMessage.textContent = 'Could not connect to content script. Make sure you are on a supported website and reload the page.';
              return;
            }
            if (!crawlResponse || !Array.isArray(crawlResponse.all)) {
              setStatus('Error', 'error');
              if (resultMessage) resultMessage.textContent = 'No links found or unable to crawl site.';
              return;
            }
            function filterLinks(arr) {
              return (arr || []).filter(l => !l.endsWith('/#'));
            }
            const allLinks = filterLinks(crawlResponse.all);
            window.sitemapLinks = allLinks;
            if (allLinks.length === 0) {
              if (resultMessage) resultMessage.innerHTML = '<div class="empty-state">No internal links found.</div>';
              showUrlList([]);
            } else {
              if (resultMessage) {
                resultMessage.innerHTML = `
                  <div style="margin-bottom:8px;display:flex;align-items:center;gap:10px;">
                    <b style="min-width:200px;">Total Internal Links Found: ${allLinks.length}</b>
                    <button id="toggleLinksBtn" class="main-button" style="padding:4px 16px;font-size:13px;height:auto;min-width:90px;box-shadow:none;">Show List</button>
                  </div>
                `;
              }
              showUrlList([]); // Start collapsed
              const toggleBtn = document.getElementById('toggleLinksBtn');
              let expanded = false;
              if (toggleBtn) {
                toggleBtn.onclick = () => {
                  expanded = !expanded;
                  toggleBtn.textContent = expanded ? 'Hide List' : 'Show List';
                  if (expanded) {
                    showUrlList(allLinks);
                  } else {
                    showUrlList([]);
                  }
                };
              }
            }
            showDownloads(true);
            if (downloadXMLBtn) {
              downloadXMLBtn.style.display = '';
              downloadXMLBtn.disabled = allLinks.length === 0;
            }
            if (downloadHTMLBtn) {
              downloadHTMLBtn.style.display = '';
              downloadHTMLBtn.disabled = allLinks.length === 0;
            }
          });
        }
      });
    });
  }

  if (downloadXMLBtn) {
    downloadXMLBtn.addEventListener('click', () => {
      const links = window.sitemapLinks || [];
      if (links.length === 0) {
        setStatus('Error', 'error');
        if (resultMessage) resultMessage.textContent = 'No links available to generate XML sitemap.';
        return;
      }
      try {
        const xml = generateXML(links);
        downloadFile(xml, 'sitemap.xml', 'application/xml');
        setStatus('Downloaded', 'success');
        if (resultMessage) resultMessage.textContent = 'XML sitemap file generated and download started.';
      } catch (e) {
        setStatus('Error', 'error');
        if (resultMessage) resultMessage.textContent = 'Failed to download XML sitemap.';
      }
    });
  }

  if (downloadHTMLBtn) {
    downloadHTMLBtn.addEventListener('click', () => {
      const links = window.sitemapLinks || [];
      if (links.length === 0) {
        setStatus('Error', 'error');
        if (resultMessage) resultMessage.textContent = 'No links available to generate HTML sitemap.';
        return;
      }
      try {
        const html = generateHTML(links);
        downloadFile(html, 'sitemap.html', 'text/html');
        setStatus('Downloaded', 'success');
        if (resultMessage) resultMessage.textContent = 'HTML sitemap file generated and download started.';
      } catch (e) {
        setStatus('Error', 'error');
        if (resultMessage) resultMessage.textContent = 'Failed to download HTML sitemap.';
      }
    });
  }
});
