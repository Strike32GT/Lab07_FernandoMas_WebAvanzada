import express from 'express';
import UserController from '../controllers/UserController.js';
import authenticate from '../middlewares/authenticate.js';
import authorize from '../middlewares/authorize.js';

const router = express.Router();

// GET /api/users (solo el rol Admin)
router.get('/', authenticate, authorize(['admin']), UserController.getAll);
router.post('/', authenticate, authorize(['admin']), UserController.create);

// GET /api/users/me (cualquier usuario autenticado)
router.get('/me', authenticate, authorize([]), UserController.getMe);
router.put('/me', authenticate, authorize([]), UserController.updateMe);
router.get('/:id', authenticate, authorize(['admin']), UserController.getById);
router.put('/:id', authenticate, authorize(['admin']), UserController.update);
router.delete('/:id', authenticate, authorize(['admin']), UserController.remove);

export default router;
