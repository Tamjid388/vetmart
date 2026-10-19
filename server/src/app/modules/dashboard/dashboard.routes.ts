import { Router } from 'express';
import { auth } from '../../middlewares/auth.js';
import { DashboardController } from './dashboard.controller.js';

const router = Router();

// Visible to both roles (sidebar shows Dashboard to staff). Cost/profit and
// vendor-payable fields are stripped for staff inside the service (SRS Rule 2).
router.get('/', auth('admin', 'staff'), DashboardController.getSummary);

export const DashboardRoutes = router;
