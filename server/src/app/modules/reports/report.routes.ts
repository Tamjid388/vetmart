import { Router } from 'express';
import { auth } from '../../middlewares/auth.js';
import { ReportController } from './report.controller.js';

const router = Router();

// Admin only (SRS Rule 1): every report surfaces lot costs, profit, or
// shop-wide dues. Read-only: no POST/PATCH/DELETE.
router.get('/overview', auth('admin'), ReportController.getOverview);
router.get('/sales', auth('admin'), ReportController.getSales);
router.get('/purchases', auth('admin'), ReportController.getPurchases);
router.get('/profit/summary', auth('admin'), ReportController.getProfitSummary);
router.get('/profit/by-product', auth('admin'), ReportController.getProfitByProduct);
router.get('/customer-dues', auth('admin'), ReportController.getCustomerDues);
router.get('/vendor-dues', auth('admin'), ReportController.getVendorDues);
router.get('/stock', auth('admin'), ReportController.getStock);
router.get('/expiry', auth('admin'), ReportController.getExpiry);

export const ReportRoutes = router;
