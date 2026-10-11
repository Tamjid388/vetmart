import { Router } from 'express';
import { auth } from '../../middlewares/auth.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { PaymentController } from './payment.controller.js';
import { PaymentValidation } from './payment.validation.js';

const router = Router();

router.get('/', auth('admin', 'staff'), PaymentController.getAll);
router.get('/:id', auth('admin', 'staff'), PaymentController.getById);
// No PUT/PATCH/DELETE in v1: due collections are immutable ledger entries.
router.post('/', auth('admin', 'staff'), validateRequest(PaymentValidation.create), PaymentController.create);

export const PaymentRoutes = router;
