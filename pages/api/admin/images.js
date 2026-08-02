import { getServerSession } from 'next-auth/next';
import { authOptions, isAdminSession } from '@utils/authOptions';
import { isSameOriginRequest } from '@utils/requestSecurity';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ message: 'Method not allowed.' });
  if (req.method === 'POST' && !isSameOriginRequest(req))
    return res.status(403).json({ message: 'Request origin could not be verified.' });
  const session = await getServerSession(req, res, authOptions);
  if (!isAdminSession(session)) return res.status(401).json({ message: 'Your admin session has expired.' });
  try {
    if (req.method === 'POST') {
      const downloadLocation = typeof req.body?.downloadLocation === 'string' ? req.body.downloadLocation : '';
      if (!downloadLocation.startsWith('https://api.unsplash.com/'))
        return res.status(400).json({ message: 'Invalid image selection.' });
      if (!process.env.UNSPLASH_ACCESS_KEY)
        return res.status(503).json({ message: 'Unsplash search is not configured.' });
      await fetch(downloadLocation, {
        headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`, 'Accept-Version': 'v1' }
      });
      return res.status(204).end();
    }
    const query = String(req.query.q || '')
      .trim()
      .slice(0, 100);
    if (!query) return res.status(200).json({ images: [] });
    const provider = req.query.provider === 'pexels' ? 'pexels' : 'unsplash';
    const page = Math.min(Math.max(Number.parseInt(req.query.page, 10) || 1, 1), 50);
    if (provider === 'pexels') {
      if (!process.env.PEXELS_API_KEY) return res.status(503).json({ message: 'Pexels search is not configured.' });
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=12&page=${page}&orientation=landscape`,
        { headers: { Authorization: process.env.PEXELS_API_KEY } }
      );
      if (!response.ok) throw new Error(`Pexels returned ${response.status}`);
      const data = await response.json();
      return res.status(200).json({
        images: data.photos.map((photo) => ({
          id: `pexels-${photo.id}`,
          url: photo.src.landscape,
          thumb: photo.src.medium,
          alt: photo.alt || 'Pexels photograph',
          photographer: photo.photographer,
          profileUrl: photo.photographer_url,
          provider: 'Pexels',
          providerUrl: photo.url
        }))
      });
    }
    if (!process.env.UNSPLASH_ACCESS_KEY)
      return res.status(503).json({ message: 'Unsplash search is not configured.' });
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=12&page=${page}&orientation=landscape&content_filter=high`,
      { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`, 'Accept-Version': 'v1' } }
    );
    if (!response.ok) throw new Error(`Unsplash returned ${response.status}`);
    const data = await response.json();
    return res.status(200).json({
      images: data.results.map((photo) => ({
        id: photo.id,
        url: photo.urls.regular,
        thumb: photo.urls.small,
        alt: photo.alt_description || photo.description || 'Unsplash photograph',
        photographer: photo.user.name,
        profileUrl: `${photo.user.links.html}?utm_source=singhbuildstech&utm_medium=referral`,
        provider: 'Unsplash',
        providerUrl: 'https://unsplash.com',
        downloadLocation: photo.links.download_location
      }))
    });
  } catch (error) {
    console.error('Unsplash image request failed:', error.message);
    return res.status(502).json({ message: 'The image provider could not be reached.' });
  }
}
