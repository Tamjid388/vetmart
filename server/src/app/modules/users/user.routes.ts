import { Router } from 'express';
import { auth } from '../../middlewares/auth.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { UserController } from './user.controller.js';
import { UserValidation } from './user.validation.js';

const router = Router();

// Public
router.post('/register', validateRequest(UserValidation.register), UserController.register);
router.post('/login', validateRequest(UserValidation.login), UserController.login);
router.post('/refresh-token', validateRequest(UserValidation.refreshToken), UserController.refreshToken);
// Public by design: clears cookies even without a valid token.
router.post('/logout', UserController.logout);

// Authenticated
router.get('/me', auth(), UserController.getMe);

export const AuthRoutes = router;

const userRouter = Router();

userRouter.post('/', auth('admin'), validateRequest(UserValidation.createUser), UserController.createUser);
userRouter.get('/', auth('admin'), UserController.getAll);
userRouter.get('/:id', auth('admin'), UserController.getById);
userRouter.patch('/:id', auth('admin'), validateRequest(UserValidation.update), UserController.updateById);
userRouter.delete('/:id', auth('admin'), UserController.softDelete);

export const UserRoutes = userRouter;
