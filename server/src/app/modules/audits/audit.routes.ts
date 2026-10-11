import { Router } from 'express';
import { auth } from '../../middlewares/auth.js';
import { AuditController } from './audit.controller.js';

const router = Router();

// Admin only: the timeline surfaces purchase lot costs and void trails
// (SRS Rule 1 — lot costs must never reach staff). Read-only: no
// POST/PATCH/DELETE, the module only observes existing rows.
router.get('/overview', auth('admin'), AuditController.getOverview);
router.get('/events', auth('admin'), AuditController.getEvents);
router.get('/events/:module/:id', auth('admin'), AuditController.getEventDetail);

export const AuditRoutes = router;
