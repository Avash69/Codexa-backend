// import express from 'express';
// import {
//     getProfile,
//     updatePassword,
//     updateProfile,
//     uploadProfileImage
// } from '../controllers/profileController.js';
// import { protect } from '../middlewares/auth.js';
// import { handleMulterError, uploadProfileImage as uploadMiddleware } from '../middlewares/upload.js';

// const router = express.Router();

// /**
//  * All profile routes require authentication
//  */
// router.use(protect);

// /**
//  * @route   GET /api/profile
//  * @desc    Get the current user's profile
//  * @access  Private
//  */
// router.get('/', getProfile);

// /**
//  * @route   PUT /api/profile
//  * @desc    Update profile information
//  * @access  Private
//  */
// router.put('/', updateProfile);

// /**
//  * @route   PUT /api/profile/password
//  * @desc    Update user's password
//  * @access  Private
//  */
// router.put('/password', updatePassword);

// /**
//  * @route   POST /api/profile/image
//  * @desc    Upload profile image
//  * @access  Private
//  */
// router.post('/image', uploadMiddleware, handleMulterError, uploadProfileImage);

// export default router;


import express from 'express';
import {
    getProfile,
    updatePassword,
    updateProfile,
    uploadProfileImage
} from '../controllers/profileController.js';
import { protect } from '../middlewares/auth.js';
import { handleMulterError, uploadProfileImage as uploadMiddleware } from '../middlewares/upload.js';

const router = express.Router();

/**
 * All profile routes require authentication
 */
router.use(protect);

/**
 * @route   GET /api/profile
 * @desc    Get the current user's profile
 * @access  Private
 */
router.get('/', getProfile);

/**
 * @route   PUT /api/profile
 * @desc    Update profile information
 * @access  Private
 */
router.put('/', updateProfile);

/**
 * @route   PUT /api/profile/password
 * @desc    Update user's password
 * @access  Private
 */
router.put('/password', updatePassword);

/**
 * @route   POST /api/profile/image
 * @desc    Upload profile image
 * @access  Private
 */
router.post('/image', uploadMiddleware, handleMulterError, uploadProfileImage);

export default router;