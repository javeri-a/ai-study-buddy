import express from 'express';
import { signup, login, getMe, updateProfilePicture } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', protect, getMe);
router.patch('/profile-picture', protect, updateProfilePicture);

export default router;