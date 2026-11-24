import { Router } from 'express';
import { verifyCertificate, renderCertificateHtml } from './certificate.controller.js';

const router = Router();

// Public routes for verification and viewing
router.get('/verify/:code', verifyCertificate);
router.get('/verify', verifyCertificate);
router.get('/:id/html', renderCertificateHtml);
router.get('/:id/view', renderCertificateHtml);

export default router;
