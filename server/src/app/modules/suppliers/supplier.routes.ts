import { Router } from 'express';
import { auth } from '../../middlewares/auth.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { SupplierController } from './supplier.controller.js';
import { SupplierValidation } from './supplier.validation.js';

const router = Router();

router.get('/', auth('admin', 'staff'), SupplierController.getAll);
// NOTE: `/dropdown` must stay above `/:id` — otherwise Express treats
// it as an id and routes it to getById.
router.get('/dropdown', auth('admin', 'staff'), SupplierController.getDropdown);
router.get('/:id', auth('admin', 'staff'), SupplierController.getById);
router.post('/', auth('admin', 'staff'), validateRequest(SupplierValidation.create), SupplierController.create);
router.patch(
  '/:id',
  auth('admin', 'staff'),
  validateRequest(SupplierValidation.update),
  SupplierController.updateById,
);
router.delete('/:id', auth('admin', 'staff'), SupplierController.softDelete);

export const SupplierRoutes = router;
