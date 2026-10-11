import { Router } from 'express';
import { auth } from '../../middlewares/auth.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { PurchaseController } from './purchase.controller.js';
import { PurchaseValidation } from './purchase.validation.js';

const router = Router();

// Admin only (SRS Rule 1): lot costs must never reach staff.
router.get('/', auth('admin'), PurchaseController.getAll);
router.get('/:id', auth('admin'), PurchaseController.getById);
// No PUT/PATCH/DELETE: no purchase edit (Rule 22) — void only.
router.post('/', auth('admin'), validateRequest(PurchaseValidation.create), PurchaseController.create);
// Full-purchase void only (Rule 22) — no partial void, no edit.
router.post('/:id/void', auth('admin'), PurchaseController.voidPurchase);

export const PurchaseRoutes = router;
