import { Router } from 'express';
import { auth } from '../../middlewares/auth.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { SupplierController } from './supplier.controller.js';
import { SupplierValidation } from './supplier.validation.js';

const router = Router();

router.get('/', auth('admin', 'staff'), SupplierController.getAll);
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
