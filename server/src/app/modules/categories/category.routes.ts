import { Router } from 'express';
import { auth } from '../../middlewares/auth.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { CategoryController } from './category.controller.js';
import { CategoryValidation } from './category.validation.js';

const router = Router();

// Staff need to list categories inside Add Product; only admins manage them.
router.get('/', auth('admin', 'staff'), CategoryController.getAll);
router.get('/:id', auth('admin', 'staff'), CategoryController.getById);
router.post('/', auth('admin'), validateRequest(CategoryValidation.create), CategoryController.create);
router.patch(
  '/:id',
  auth('admin'),
  validateRequest(CategoryValidation.update),
  CategoryController.updateById,
);
router.delete('/:id', auth('admin'), CategoryController.softDelete);

export const CategoryRoutes = router;
