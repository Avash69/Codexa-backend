// import express from 'express';
// import {
//   getCurrentUser,
//   getUserSessions,
//   login,
//   logout,
//   logoutAllSessions,
//   logoutSession,
//   register
// } from '../controllers/authController.js';
// import { protect } from '../middlewares/auth.js';

// const router = express.Router();

// /**
//  * @route   POST /api/auth/register
//  * @desc    Register a new user
//  * @access  Public
//  */
// router.post('/register', register);

// /**
//  * @route   POST /api/auth/login
//  * @desc    Login user
//  * @access  Public
//  */
// router.post('/login', login);

// /**
//  * @route   POST /api/auth/logout
//  * @desc    Logout user (current session)
//  * @access  Private
//  */
// router.post('/logout', protect, logout);

// /**
//  * @route   GET /api/auth/me
//  * @desc    Get current user profile
//  * @access  Private
//  */
// router.get('/me', protect, getCurrentUser);

// /**
//  * @route   GET /api/auth/sessions
//  * @desc    Get all active sessions for the user
//  * @access  Private
//  */
// router.get('/sessions', protect, getUserSessions);

// /**
//  * @route   DELETE /api/auth/sessions/:sessionId
//  * @desc    Logout from a specific session
//  * @access  Private
//  */
// router.delete('/sessions/:sessionId', protect, logoutSession);

// /**
//  * @route   DELETE /api/auth/sessions
//  * @desc    Logout from all sessions
//  * @access  Private
//  */
// router.delete('/sessions', protect, logoutAllSessions);

// export default router;


import express from 'express';
import {
  getCurrentUser,
  getUserSessions,
  login,
  logout,
  logoutAllSessions,
  logoutSession,
  register
} from '../controllers/authController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (current session)
 * @access  Private
 */
router.post('/logout', protect, logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', protect, getCurrentUser);

/**
 * @route   GET /api/auth/sessions
 * @desc    Get all active sessions for the user
 * @access  Private
 */
router.get('/sessions', protect, getUserSessions);

/**
 * @route   DELETE /api/auth/sessions/:sessionId
 * @desc    Logout from a specific session
 * @access  Private
 */
router.delete('/sessions/:sessionId', protect, logoutSession);

/**
 * @route   DELETE /api/auth/sessions
 * @desc    Logout from all sessions
 * @access  Private
 */
router.delete('/sessions', protect, logoutAllSessions);

export default router;