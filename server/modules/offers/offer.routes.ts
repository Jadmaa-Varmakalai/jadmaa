import { Router } from 'express';
import { authenticate, requireAdmin } from '../../middleware/auth.middleware.js';
import { publicEnquiryLimiter } from '../../middleware/rateLimiter.js';
import * as offerController from './offer.controller.js';
import * as offerAdminController from './offer.admin.controller.js';

const publicRouter = Router();

// Public & student endpoints
publicRouter.get('/active-popup', offerController.getActivePopupOffer);
publicRouter.get('/:slug', offerController.getOfferBySlug);
publicRouter.post('/:slug/book', authenticate, offerController.initiateOfferBooking);
publicRouter.post('/:slug/verify', authenticate, offerController.verifyOfferPayment);
publicRouter.post('/:slug/enquire', publicEnquiryLimiter, offerController.submitOfferEnquiry);

// Admin sub-router
export const adminRouter = Router();
adminRouter.get('/', authenticate, requireAdmin, offerAdminController.getAdminOffers);
adminRouter.post('/', authenticate, requireAdmin, offerAdminController.createOffer);
adminRouter.get('/settings', authenticate, requireAdmin, offerAdminController.getOfferSettings);
adminRouter.put('/settings', authenticate, requireAdmin, offerAdminController.updateOfferSettings);
adminRouter.get('/bookings', authenticate, requireAdmin, offerAdminController.getOfferBookings);
adminRouter.get('/:id', authenticate, requireAdmin, offerAdminController.getAdminOfferById);
adminRouter.put('/:id', authenticate, requireAdmin, offerAdminController.updateOffer);
adminRouter.patch('/:id/toggle', authenticate, requireAdmin, offerAdminController.toggleOffer);
adminRouter.post('/:id/duplicate', authenticate, requireAdmin, offerAdminController.duplicateOffer);
adminRouter.delete('/:id', authenticate, requireAdmin, offerAdminController.deleteOffer);

export default publicRouter;

