export async function checkSitemap(domain) {
  const paths = ['/sitemap.xml', '/sitemap_index.xml', '/robots.txt'];
  for (const path of paths) {
    try {
      const res = await fetch(domain + path);
      const text = await res.text();
      if (res.ok && (text.includes('<urlset') || text.includes('Sitemap:'))) {
        return { exists: true, source: domain + path };
      }
    } catch (_) {}
  }
  return { exists: false };
}
