function generateXML(links) {
  const urls = links.map(link => `
    <url>
      <loc>${link}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.5</priority>
    </url>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls}
  </urlset>`;
}

function generateHTML(links) {
  const items = links.map(link => `<li><a href="${link}">${link}</a></li>`).join('');
  return `<!DOCTYPE html>
  <html><head><title>Sitemap</title></head>
  <body><ul>${items}</ul></body></html>`;
}
