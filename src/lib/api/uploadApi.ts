import { fetchApi } from './apiClient';

export interface UploadResult {
  url: string;
}

export const uploadApi = {
  uploadImage: async (base64OrDataUrl: string, filename?: string): Promise<string> => {
    // If it's already an external URL, just return it
    if (base64OrDataUrl.startsWith('http://') || base64OrDataUrl.startsWith('https://')) {
      return base64OrDataUrl;
    }

    try {
      const res = await fetchApi('/upload', {
        method: 'POST',
        body: JSON.stringify({ image: base64OrDataUrl, filename }),
      });
      if (res?.data?.url) {
        return res.data.url;
      }
    } catch (err) {
      console.warn('[uploadApi] Remote upload endpoint failed, falling back to local data URL:', err);
    }

    // Reliable fallback: return the processed data URL directly
    return base64OrDataUrl;
  }
};
