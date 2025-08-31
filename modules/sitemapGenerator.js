export function generateXML(links) {
  const today = new Date().toISOString().split('T')[0];
  const urls = links.map(link => `\n    <url>\n      <loc>${link}</loc>\n      <lastmod>${today}</lastmod>\n      <changefreq>weekly</changefreq>\n      <priority>0.5</priority>\n    </url>`).join('');
  return `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">${urls}\n</urlset>`;
}

export function generateHTML(links) {
  const items = links.map(link => `<li><a href=\"${link}\">${link}</a></li>`).join('');
  return `<!DOCTYPE html>\n<html><head><title>Sitemap</title></head>\n<body><ul>${items}</ul></body></html>`;
}
