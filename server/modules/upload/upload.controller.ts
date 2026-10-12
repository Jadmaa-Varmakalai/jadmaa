import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

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
      // If it's another form of string, return as is
      return res.json({ success: true, data: { url: image } });
    }

    const rawExt = match[1].toLowerCase();
    const ext = rawExt === 'jpeg' ? 'jpg' : rawExt === 'svg+xml' ? 'svg' : rawExt;
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Create safe file name
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const cleanBaseName = filename 
      ? filename.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30)
      : 'upload';
    const outputFileName = `${cleanBaseName}_${timestamp}_${randomSuffix}.${ext}`;

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');

    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filePath = path.join(uploadsDir, outputFileName);
      fs.writeFileSync(filePath, buffer);
      
      const fileUrl = `/uploads/${outputFileName}`;
      return res.json({ success: true, data: { url: fileUrl } });
    } catch (fsErr) {
      console.warn('[Upload] Disk write failed (likely read-only environment), falling back to data URL:', fsErr);
      // Fallback: return data URL directly so uploading always works seamlessly
      return res.json({ success: true, data: { url: image } });
    }
  } catch (error: any) {
    console.error('[Upload] Error processing image upload:', error);
    res.status(500).json({ success: false, error: { message: error.message || 'Error uploading image' } });
  }
};
