import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import * as dashboardController from '../controllers/dashboardController.js';
import * as conversationController from '../controllers/conversationController.js';
import * as contactController from '../controllers/contactController.js';
import * as botController from '../controllers/botController.js';
import * as autoReplyController from '../controllers/autoReplyController.js';
import * as faqController from '../controllers/faqController.js';
import * as templateController from '../controllers/templateController.js';
import * as campaignController from '../controllers/campaignController.js';
import * as settingsController from '../controllers/settingsController.js';
import * as webhookController from '../controllers/webhookController.js';
import * as businessConfigController from '../controllers/businessConfigController.js';
import * as catalogController from '../controllers/catalogController.js';
import * as bookingController from '../controllers/bookingController.js';
import * as orderController from '../controllers/orderController.js';
import { authenticate, optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

// --- Auth Routes ---
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/demo-login', authController.demoLogin);
router.get('/auth/me', authenticate, authController.getMe);

// --- Dashboard Routes ---
router.get('/dashboard/overview', optionalAuth, dashboardController.getOverview);

// --- Conversations Routes ---
router.get('/conversations', optionalAuth, conversationController.getConversations);
router.get('/conversations/:id', optionalAuth, conversationController.getConversationById);
router.post('/conversations/:id/messages', optionalAuth, conversationController.sendMessage);
router.post('/conversations/:id/simulate', optionalAuth, conversationController.simulateIncomingMessage);
router.patch('/conversations/:id/status', optionalAuth, conversationController.updateConversationStatus);
router.patch('/conversations/:id/assign', optionalAuth, conversationController.assignAgent);
router.patch('/conversations/:id/notes', optionalAuth, conversationController.updateInternalNotes);
router.post('/conversations/:id/resume-bot', optionalAuth, conversationController.resumeBot);
router.get('/conversations/:id/session', optionalAuth, conversationController.getConversationSession);

// --- Contacts Routes ---
router.get('/contacts', optionalAuth, contactController.getContacts);
router.get('/contacts/export/csv', contactController.exportContactsCsv);
router.post('/contacts', optionalAuth, contactController.createContact);
router.put('/contacts/:id', optionalAuth, contactController.updateContact);
router.delete('/contacts/:id', optionalAuth, contactController.deleteContact);

// --- Business Profile & Welcome Menu Routes ---
router.get('/business-config', optionalAuth, businessConfigController.getBusinessConfig);
router.put('/business-config', optionalAuth, businessConfigController.updateBusinessConfig);

// --- Catalog & Services Routes ---
router.get('/catalog', optionalAuth, catalogController.getCatalog);
router.post('/catalog', optionalAuth, catalogController.createCatalogItem);
router.put('/catalog/:id', optionalAuth, catalogController.updateCatalogItem);
router.delete('/catalog/:id', optionalAuth, catalogController.deleteCatalogItem);

// --- Bookings & Appointments Routes ---
router.get('/bookings', optionalAuth, bookingController.getBookings);
router.patch('/bookings/:id/status', optionalAuth, bookingController.updateBookingStatus);
router.get('/bookings/track/:ref', bookingController.trackBooking);

// --- Product Orders Routes ---
router.get('/orders', optionalAuth, orderController.getOrders);
router.patch('/orders/:id/status', optionalAuth, orderController.updateOrderStatus);
router.get('/orders/track/:ref', orderController.trackOrder);

// --- Bot Settings & Builder Routes ---
router.get('/bot/settings', optionalAuth, botController.getBotSettings);
router.put('/bot/settings', optionalAuth, botController.updateBotSettings);
router.post('/bot/simulate', optionalAuth, botController.testSimulator);

// --- Automated Reply Rules Routes ---
router.get('/auto-replies', optionalAuth, autoReplyController.getRules);
router.post('/auto-replies', optionalAuth, autoReplyController.createRule);
router.put('/auto-replies/:id', optionalAuth, autoReplyController.updateRule);
router.patch('/auto-replies/:id/toggle', optionalAuth, autoReplyController.toggleRule);
router.delete('/auto-replies/:id', optionalAuth, autoReplyController.deleteRule);

// --- FAQ Management Routes ---
router.get('/faqs', optionalAuth, faqController.getFaqs);
router.post('/faqs', optionalAuth, faqController.createFaq);
router.put('/faqs/:id', optionalAuth, faqController.updateFaq);
router.delete('/faqs/:id', optionalAuth, faqController.deleteFaq);

// --- Message Templates Routes ---
router.get('/templates', optionalAuth, templateController.getTemplates);
router.post('/templates', optionalAuth, templateController.createTemplate);
router.put('/templates/:id', optionalAuth, templateController.updateTemplate);
router.delete('/templates/:id', optionalAuth, templateController.deleteTemplate);
router.post('/templates/:id/submit-approval', optionalAuth, templateController.submitTemplateForApproval);

// --- Campaigns Routes ---
router.get('/campaigns', optionalAuth, campaignController.getCampaigns);
router.post('/campaigns', optionalAuth, campaignController.createCampaign);

// --- WhatsApp API Settings Routes ---
router.get('/settings', optionalAuth, settingsController.getSettings);
router.put('/settings', optionalAuth, settingsController.updateSettings);
router.post('/settings/test-connection', optionalAuth, settingsController.testConnection);
router.post('/settings/reset-demo', optionalAuth, settingsController.resetDemoData);

// --- Official Webhooks Routes (Meta Cloud API) ---
router.get('/webhooks/whatsapp', webhookController.verifyWebhook);
router.post('/webhooks/whatsapp', webhookController.receiveWebhook);

export default router;
