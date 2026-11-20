import { Request, Response } from 'express';
import { prisma } from '../../db.js';
import QRCode from 'qrcode';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.APP_URL || 'https://jadmaa.com';

/**
 * Public certificate verification
 * Searches by verificationCode or certificateNumber
 */
export const verifyCertificate = async (req: Request, res: Response) => {
  try {
    const rawCode = (req.params.code || req.query.code as string || '').trim();
    if (!rawCode) {
      return res.status(400).json({ success: false, error: { message: 'Verification code is required' } });
    }

    const cert = await prisma.certificate.findFirst({
      where: {
        OR: [
          { verificationCode: rawCode },
          { certificateNumber: rawCode },
          { id: rawCode }
        ]
      },
      include: {
        user: { select: { id: true, name: true } },
        course: { 
          select: { 
            id: true, 
            title: true, 
            isFree: true, 
            price: true,
            instructor: { select: { displayName: true } }
          } 
        }
      }
    });

    if (!cert) {
      return res.status(404).json({
        success: false,
        error: { message: 'Certificate not found. This credential may be invalid or unissued.' }
      });
    }

    // Explicit business rule: Certificates are NOT issued or valid for free courses
    if (cert.course?.isFree || (cert.course?.price || 0) <= 0) {
      return res.status(403).json({
        success: false,
        error: { message: 'Certificates are not issued for free introductory courses.' }
      });
    }

    if (cert.status === 'REVOKED') {
      return res.status(410).json({
        success: false,
        error: { message: 'This certificate has been revoked by JADMAA Varmakalai Academy administration.' }
      });
    }

    res.json({
      success: true,
      data: {
        certificateNumber: cert.certificateNumber,
        verificationCode: cert.verificationCode,
        studentName: cert.user?.name || 'Valued Practitioner',
        courseTitle: cert.course?.title,
        issuedAt: cert.issuedAt,
        status: cert.status,
        instructor: cert.course?.instructor?.displayName || 'Varma Aasan Mr. Bojagarajan',
        issuingAuthority: 'JADMAA Varmakalai Academy',
        verified: true
      }
    });
  } catch (err: any) {
    console.error('verifyCertificate error:', err);
    res.status(500).json({ success: false, error: { message: 'Server error verifying certificate' } });
  }
};

/**
 * Render printable HTML certificate
 */
export const renderCertificateHtml = async (req: Request, res: Response) => {
  try {
    const certId = (req.params.id as string).trim();
    const shouldPrint = req.query.print === 'true';

    const cert = await prisma.certificate.findFirst({
      where: {
        OR: [
          { id: certId },
          { certificateNumber: certId },
          { verificationCode: certId }
        ]
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: {
          select: {
            id: true,
            title: true,
            isFree: true,
            price: true,
            instructor: { select: { displayName: true } }
          }
        }
      }
    });

    if (!cert) {
      return res.status(404).send(`
        <!doctype html>
        <html><head><title>Certificate Not Found | JADMAA</title>
        <style>body{font-family:sans-serif;text-align:center;padding:50px;color:#2b2521;background:#faf6f0;}h1{color:#b12b2b;}</style>
        </head><body>
        <h1>Certificate Not Found</h1>
        <p>The requested credential does not exist or has been removed.</p>
        <p><a href="/student/certificates" style="color:#b12b2b;">Return to My Certificates</a></p>
        </body></html>
      `);
    }

    // Business rule: Certificates are NOT for free courses
    if (cert.course?.isFree || (cert.course?.price || 0) <= 0) {
      return res.status(403).send(`
        <!doctype html>
        <html><head><title>Certificate Not Available | JADMAA</title>
        <style>body{font-family:sans-serif;text-align:center;padding:50px;color:#2b2521;background:#faf6f0;}h1{color:#b12b2b;}</style>
        </head><body>
        <h1>Official Notice</h1>
        <p>Certificates of Achievement are not issued for free courses. They are granted exclusively for certified paid curricula.</p>
        <p><a href="/student/certificates" style="color:#b12b2b;">Return to My Certificates</a></p>
        </body></html>
      `);
    }

    if (cert.status === 'REVOKED') {
      return res.status(410).send(`
        <!doctype html>
        <html><head><title>Certificate Revoked | JADMAA</title>
        <style>body{font-family:sans-serif;text-align:center;padding:50px;color:#2b2521;background:#faf6f0;}h1{color:#b12b2b;}</style>
        </head><body>
        <h1>Certificate Revoked</h1>
        <p>This certificate has been revoked by JADMAA Varmakalai Academy administration.</p>
        </body></html>
      `);
    }

    // Locate the enhanced template file
    const templatePaths = [
      path.resolve(process.cwd(), 'public', 'certificate-template.html'),
      path.resolve(process.cwd(), 'dist', 'certificate-template.html'),
      '/var/www/jadmaa/frontend/certificate-template.html',
      path.resolve(__dirname, '../../public/certificate-template.html')
    ];

    let templateHtml = '';
    for (const p of templatePaths) {
      if (fs.existsSync(p)) {
        templateHtml = fs.readFileSync(p, 'utf8');
        break;
      }
    }

    if (!templateHtml) {
      return res.status(500).send('Certificate template missing on server.');
    }

    // Generate dynamic QR Code pointing to verification URL
    const verificationUrl = `${BASE_URL}/verify/${encodeURIComponent(cert.verificationCode)}`;
    const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 140,
      color: {
        dark: '#2B2521',
        light: '#FFFFFF'
      }
    });

    const completionDateFormatted = new Date(cert.issuedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const studentName = cert.user?.name || 'Valued Practitioner';
    const courseTitle = cert.course?.title || 'Varmakalai Professional Training';
    const instructorName = cert.course?.instructor?.displayName || 'Varma Senior Master';

    // Replace template tokens
    let rendered = templateHtml
      .replace(/{{studentName}}/g, studentName)
      .replace(/{{courseName}}/g, courseTitle)
      .replace(/{{completionDate}}/g, completionDateFormatted)
      .replace(/{{certificateNumber}}/g, cert.certificateNumber)
      .replace(/{{certificateId}}/g, cert.certificateNumber)
      .replace(/{{verificationCode}}/g, cert.verificationCode)
      .replace(/{{courseDuration}}/g, 'Comprehensive Certified Curriculum')
      .replace(/{{grade}}/g, 'Distinction')
      .replace(/{{instructorName}}/g, instructorName)
      .replace(/{{authorizedName}}/g, 'Varma Aasan Mr. Bojagarajan')
      .replace(/{{verificationUrl}}/g, verificationUrl)
      .replace(/src="[^"]*sampleQrCode[^"]*"/g, `src="${qrCodeDataUrl}"`)
      .replace(/{{qrCodeDataUrl}}/g, qrCodeDataUrl);

    // Auto-trigger print dialog if requested
    if (shouldPrint) {
      rendered = rendered.replace(
        '</body>',
        '<script>window.addEventListener("load", function() { setTimeout(function() { window.print(); }, 400); });</script></body>'
      );
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'private, max-age=300');
    return res.send(rendered);
  } catch (err: any) {
    console.error('renderCertificateHtml error:', err);
    res.status(500).send('Failed to render certificate.');
  }
};
