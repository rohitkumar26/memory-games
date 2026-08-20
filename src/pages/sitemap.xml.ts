import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const gameManifests = import.meta.glob('../games/*/manifest.json', { eager: true });
  const gameIds = Object.keys(gameManifests).map(path =>
    path.replace('../games/', '').replace('/manifest.json', '')
  );

  const baseUrl = 'https://kidsmemorygames.pages.dev';
  const lastmod = new Date().toISOString().split('T')[0];

  const urls = [
    `  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`,
    ...gameIds.map(id => `  <url>
    <loc>${baseUrl}/play/${id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`)
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8'
    }
  });
};
