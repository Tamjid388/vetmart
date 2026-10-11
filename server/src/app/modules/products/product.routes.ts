import { Router } from 'express';
import { auth } from '../../middlewares/auth.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { ProductController } from './product.controller.js';
import { ProductValidation } from './product.validation.js';

const router = Router();

// Public

// Get all products
router.get('/', ProductController.getAll);

// Get product details by id
router.get('/:id', ProductController.getById);

// Add Product

router.post('/', auth('admin', 'staff'), validateRequest(ProductValidation.create), ProductController.create);

// Update Product
router.patch('/:id', auth('admin', 'staff'), validateRequest(ProductValidation.update), ProductController.updateById);
// delete Product
router.delete('/:id', auth('admin', 'staff'), ProductController.softDelete);

export const ProductRoutes = router;
