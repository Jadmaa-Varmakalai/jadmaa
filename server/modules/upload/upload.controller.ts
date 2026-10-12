import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

// Lazy-load Supabase client to avoid startup errors if env vars missing
let supabaseClient: any = null;

const getSupabaseClient = async () => {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabaseClient = createClient(supabaseUrl, supabaseKey);
    return supabaseClient;
  } catch (err) {
    console.warn('[Upload] Supabase client init failed:', err);
    return null;
  }
};

/**
 * Upload image to Supabase Storage bucket 'blog-images'.
 * Returns the public URL or null if it fails.
 */
const uploadToSupabase = async (buffer: Buffer, fileName: string, mimeType: string): Promise<string | null> => {
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) return null;

    const bucketName = 'blog-images';

    // Ensure bucket exists (it must be created in Supabase dashboard first)
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(`uploads/${fileName}`, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.warn('[Upload] Supabase upload error:', error.message);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(`uploads/${fileName}`);

    return urlData?.publicUrl || null;
  } catch (err) {
    console.warn('[Upload] Supabase upload exception:', err);
    return null;
  }
};

export const uploadImage = async (req: Request, res: Response) => {
  try {
    const { image, filename } = req.body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({ success: false, error: { message: 'Image data is required' } });
    }

    // If it's already a regular http/https URL, return it
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return res.json({ success: true, data: { url: image } });
    }

    // Check if it is a base64 data URL
    const match = image.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!match) {
      // If it's another form of string (e.g. relative path), return as is
      return res.json({ success: true, data: { url: image } });
    }

    const rawExt = match[1].toLowerCase();
    const ext = rawExt === 'jpeg' ? 'jpg' : rawExt === 'svg+xml' ? 'svg' : rawExt;
    const mimeType = rawExt === 'svg+xml' ? 'image/svg+xml' : `image/${rawExt}`;
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Create safe file name
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const cleanBaseName = filename
      ? filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30)
      : 'upload';
    const outputFileName = `${cleanBaseName}_${timestamp}_${randomSuffix}.${ext}`;

    // 1. Try Supabase Storage first (persistent across deployments)
    const supabaseUrl = await uploadToSupabase(buffer, outputFileName, mimeType);
    if (supabaseUrl) {
      console.log('[Upload] Stored in Supabase Storage:', supabaseUrl);
      return res.json({ success: true, data: { url: supabaseUrl } });
    }

    // 2. Try local disk (works in dev / self-hosted)
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filePath = path.join(uploadsDir, outputFileName);
      fs.writeFileSync(filePath, buffer);
      const fileUrl = `/uploads/${outputFileName}`;
      console.log('[Upload] Stored on local disk:', fileUrl);
      return res.json({ success: true, data: { url: fileUrl } });
    } catch (fsErr) {
      console.warn('[Upload] Disk write failed (likely read-only environment):', fsErr);
    }

    // 3. Last-resort fallback: return data URL so the upload doesn't silently fail.
    // Note: data URLs saved to DB are large; this only happens when both Supabase
    // and local disk are unavailable.
    console.warn('[Upload] Both Supabase and disk unavailable. Returning data URL fallback.');
    return res.json({ success: true, data: { url: image } });

  } catch (error: any) {
    console.error('[Upload] Error processing image upload:', error);
    res.status(500).json({ success: false, error: { message: error.message || 'Error uploading image' } });
  }
};
