import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Lazy-load Supabase client to avoid startup errors if env vars missing
let supabaseClient: any = null;

const getSupabaseClient = async () => {
  if (supabaseClient) return supabaseClient;

  let supabaseUrl = process.env.SUPABASE_URL;
  let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    try {
      const dotenv = await import('dotenv');
      dotenv.config({ override: true });
      supabaseUrl = process.env.SUPABASE_URL;
      supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    } catch (_) {}
  }

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[Upload] Supabase missing credentials. URL:', Boolean(supabaseUrl), 'Key present:', Boolean(supabaseKey));
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
 * Upload image buffer to Supabase Storage bucket 'blog-images'.
 * Returns the public URL or null if it fails.
 */
const uploadToSupabase = async (buffer: Buffer, fileName: string, mimeType: string): Promise<string | null> => {
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) return null;

    const bucketName = 'blog-images';

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(`uploads/${fileName}`, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.warn('[Upload] Supabase upload error:', error.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(`uploads/${fileName}`);

    return urlData?.publicUrl || null;
  } catch (err) {
    console.warn('[Upload] Supabase upload exception:', err);
    return null;
  }
};

/**
 * VULN-02 Defense: Magic Byte / File Signature Validation.
 * Inspects the actual binary header rather than trusting client MIME types or file extensions.
 */
export function validateImageMagicBytes(buffer: Buffer): {
  valid: boolean;
  ext: 'jpg' | 'png' | 'webp' | 'gif' | 'avif' | null;
  mime: string | null;
} {
  if (!buffer || buffer.length < 12) {
    return { valid: false, ext: null, mime: null };
  }

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, ext: 'jpg', mime: 'image/jpeg' };
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { valid: true, ext: 'png', mime: 'image/png' };
  }

  // 3. WebP: RIFF (bytes 0-3) + WEBP (bytes 8-11)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, ext: 'webp', mime: 'image/webp' };
  }

  // 4. GIF: GIF87a or GIF89a
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) &&
    buffer[5] === 0x61
  ) {
    return { valid: true, ext: 'gif', mime: 'image/gif' };
  }

  // 5. AVIF: ftypavif or ftypavis (offset 4-11)
  if (
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70 &&
    buffer[8] === 0x61 &&
    buffer[9] === 0x76 &&
    buffer[10] === 0x69 &&
    (buffer[11] === 0x66 || buffer[11] === 0x73)
  ) {
    return { valid: true, ext: 'avif', mime: 'image/avif' };
  }

  return { valid: false, ext: null, mime: null };
}

const MAX_IMAGE_BYTES_ADMIN = 10 * 1024 * 1024; // 10MB limit for staff/instructors (campaigns, courses, blogs)
const MAX_IMAGE_BYTES_STUDENT = 3 * 1024 * 1024; // 3MB limit for student profile avatars

export const uploadImage = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required to upload images.' },
      });
    }

    const { image, filename } = req.body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({ success: false, error: { message: 'Image data is required' } });
    }

    // If it's already a regular http/https URL, return it safely
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return res.json({ success: true, data: { url: image } });
    }

    // Explicit VULN-02 Defense: Reject SVG uploads immediately (Stored XSS mitigation)
    if (
      image.toLowerCase().includes('data:image/svg') ||
      (filename && filename.toLowerCase().endsWith('.svg'))
    ) {
      return res.status(400).json({
        success: false,
        error: {
          message:
            'SVG uploads are not permitted for security reasons (Stored XSS mitigation). Please upload a standard raster format (JPEG, PNG, or WebP).',
        },
      });
    }

    // Check if it is a base64 data URL
    const match = image.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid image format. Expected base64 data URL.' },
      });
    }

    const base64Data = match[2];
    const originalBuffer = Buffer.from(base64Data, 'base64');

    // Reject files that contain SVG markup or XML declarations inside decoded buffer
    const bufferHead = originalBuffer.slice(0, 100).toString('utf8').toLowerCase();
    if (bufferHead.includes('<svg') || bufferHead.includes('<?xml')) {
      return res.status(400).json({
        success: false,
        error: {
          message:
            'SVG/XML content is not permitted for security reasons. Please upload JPEG, PNG, or WebP.',
        },
      });
    }

    // VULN-02 Defense: Validate binary file signatures (Magic Bytes)
    const signature = validateImageMagicBytes(originalBuffer);
    if (!signature.valid || !signature.ext || !signature.mime) {
      return res.status(400).json({
        success: false,
        error: {
          message:
            'Invalid file signature: Content does not match an authentic image format (JPEG, PNG, WebP, GIF, or AVIF).',
        },
      });
    }

    // Enforce role-based file size limits
    const isStaff = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'INSTRUCTOR' || user.isAdmin;
    const maxAllowedBytes = isStaff ? MAX_IMAGE_BYTES_ADMIN : MAX_IMAGE_BYTES_STUDENT;

    if (originalBuffer.length > maxAllowedBytes) {
      const maxMb = Math.round(maxAllowedBytes / (1024 * 1024));
      return res.status(400).json({
        success: false,
        error: { message: `Image exceeds maximum allowable size of ${maxMb}MB.` },
      });
    }

    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const cleanBaseName = filename
      ? filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30)
      : 'upload';

    let optimizedBuffer: Buffer;
    let thumbBuffer: Buffer | null = null;
    let finalExt = 'webp';
    let finalMime = 'image/webp';

    // Verify & transform raster images using Sharp
    try {
      const metadata = await sharp(originalBuffer).metadata();
      if (!metadata.width || !metadata.height) {
        return res.status(400).json({
          success: false,
          error: { message: 'Corrupt or unreadable image dimensions.' },
        });
      }

      const hasAlpha = Boolean(metadata.hasAlpha || signature.ext === 'png');

      // Main optimized variant (WebP, max width 1600px)
      optimizedBuffer = await sharp(originalBuffer)
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: hasAlpha ? 82 : 80, effort: 4 })
        .toBuffer();

      // Thumbnail variant (480px) for preview cards
      thumbBuffer = await sharp(originalBuffer)
        .resize(480, 480, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80, effort: 4 })
        .toBuffer();
    } catch (sharpErr: any) {
      console.warn('[Upload] Sharp image decoding failed:', sharpErr?.message);
      return res.status(400).json({
        success: false,
        error: { message: 'Image decoding failed. The uploaded file appears to be corrupted or invalid.' },
      });
    }

    const outputFileName = `${cleanBaseName}_${timestamp}_${randomSuffix}.${finalExt}`;
    const thumbFileName = `${cleanBaseName}_${timestamp}_${randomSuffix}_thumb.${finalExt}`;

    // 1. Try Supabase Storage first
    const supabaseUrl = await uploadToSupabase(optimizedBuffer, outputFileName, finalMime);
    if (supabaseUrl) {
      if (thumbBuffer) {
        await uploadToSupabase(thumbBuffer, thumbFileName, finalMime).catch(() => {});
      }
      return res.json({
        success: true,
        data: {
          url: supabaseUrl,
          thumbnailUrl: supabaseUrl.replace(outputFileName, thumbFileName),
          format: finalExt,
        },
      });
    }

    // 2. Try local disk storage
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filePath = path.join(uploadsDir, outputFileName);
      fs.writeFileSync(filePath, optimizedBuffer);

      if (thumbBuffer) {
        const thumbPath = path.join(uploadsDir, thumbFileName);
        fs.writeFileSync(thumbPath, thumbBuffer);
      }

      const fileUrl = `/uploads/${outputFileName}`;
      return res.json({
        success: true,
        data: {
          url: fileUrl,
          thumbnailUrl: `/uploads/${thumbFileName}`,
          format: finalExt,
        },
      });
    } catch (fsErr) {
      console.warn('[Upload] Disk write failed:', fsErr);
    }

    // 3. Fallback to clean base64 WebP if storage providers are unavailable
    const fallbackDataUrl = `data:image/webp;base64,${optimizedBuffer.toString('base64')}`;
    return res.json({
      success: true,
      data: {
        url: fallbackDataUrl,
        thumbnailUrl: fallbackDataUrl,
        format: 'webp',
      },
    });
  } catch (error: any) {
    console.error('[Upload] Error processing image upload:', error);
    res.status(500).json({ success: false, error: { message: error.message || 'Error uploading image' } });
  }
};
