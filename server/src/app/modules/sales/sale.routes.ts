import { Router } from 'express';
import { auth } from '../../middlewares/auth.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { SaleController } from './sale.controller.js';
import { SaleValidation } from './sale.validation.js';

const router = Router();

router.get('/', auth('admin', 'staff'), SaleController.getAll);
router.get('/:id', auth('admin', 'staff'), SaleController.getById);
// No PUT/PATCH/DELETE in v1: no sale edit (Rule 19) — void only (E5).
router.post('/', auth('admin', 'staff'), validateRequest(SaleValidation.create), SaleController.create);
// Full-sale void only (Rule 19) — admin only, no partial void, no edit.
router.post('/:id/void', auth('admin'), SaleController.voidSale);

export const SaleRoutes = router;
