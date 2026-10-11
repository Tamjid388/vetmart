import { Router } from 'express';
import { auth } from '../../middlewares/auth.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { CustomerController } from './customer.controller.js';
import { CustomerValidation } from './customer.validation.js';

const router = Router();

router.get('/', auth('admin', 'staff'), CustomerController.getAll);
// NOTE: `/areas` must stay above `/:id` — otherwise Express treats
// "areas" as an id and routes it to getById.
router.get('/areas', auth('admin', 'staff'), CustomerController.getAreas);
router.get('/:id', auth('admin', 'staff'), CustomerController.getById);
router.post('/', auth('admin', 'staff'), validateRequest(CustomerValidation.create), CustomerController.create);
router.patch('/:id', auth('admin', 'staff'), validateRequest(CustomerValidation.update), CustomerController.updateById);
router.delete('/:id', auth('admin', 'staff'), CustomerController.softDelete);

export const CustomerRoutes = router;
