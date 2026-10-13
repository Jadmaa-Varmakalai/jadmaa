import { Request, Response } from 'express';

let reviewsCache: any = null;
let reviewsCacheTime = 0;
const REVIEWS_CACHE_TTL = 1000 * 60 * 30; // 30 minutes

export const getReviews = async (req: Request, res: Response) => {
  try {
    res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=1200');

    if (reviewsCache && Date.now() - reviewsCacheTime < REVIEWS_CACHE_TTL) {
      return res.json({ success: true, data: reviewsCache });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const placeId = 'ChIJjTIYIgC5qjsRcL6Q-fCDunM'; // Thanjavur branch

    if (!apiKey) {
      return res.json({ success: true, data: [] });
    }

    const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=id,displayName,reviews`, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': apiKey
      }
    });

    if (!response.ok) {
      const errTxt = await response.text();
      console.warn('Google Places API error (falling back to cache/empty):', response.status, errTxt);
      if (reviewsCache) {
        return res.json({ success: true, data: reviewsCache });
      }
      return res.json({ success: true, data: [] });
    }

    const data = await response.json();
    
    // Transform into the format expected by the frontend
    const testimonials = (data.reviews || []).map((r: any) => ({
      id: r.name,
      name: r.authorAttribution?.displayName || 'Unknown',
      role: 'Student', // Defaulting since Google doesn't provide role
      content: r.text?.text || r.originalText?.text || 'No content provided.',
      rating: r.rating || 5,
      avatar: r.authorAttribution?.photoUri || '',
      publishTime: r.publishTime
    }));

    // Sort by publish time descending
    testimonials.sort((a: any, b: any) => new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime());

    res.json({ success: true, data: testimonials });
  } catch (err: any) {
    console.warn('getReviews error, falling back to empty reviews list:', err);
    res.json({ success: true, data: [] });
  }
};
