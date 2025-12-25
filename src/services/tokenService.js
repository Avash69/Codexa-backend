import jwt from 'jsonwebtoken';
import config from '../config/index.js';

/**
 * Generate JWT token
 * @param {Object} payload - Data to be included in the token
 * @param {String} expiresIn - Token expiration time
 * @returns {String} JWT token
 */
export const generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, config.jwtSecret, { expiresIn });
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    throw error;
  }
};

/**
 * Decode JWT token without verification
 * @param {String} token - JWT token to decode
 * @returns {Object} Decoded token payload
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};

/**
 * Calculate token expiration date
 * @param {String} expiresIn - Token expiration time (e.g., '7d', '30m')
 * @returns {Date} Expiration date
 */
export const calculateExpirationDate = (expiresIn = '7d') => {
  const unit = expiresIn.slice(-1);
  const value = parseInt(expiresIn.slice(0, -1));
  
  const now = new Date();
  
  switch (unit) {
    case 's':
      return new Date(now.getTime() + value * 1000);
    case 'm':
      return new Date(now.getTime() + value * 60 * 1000);
    case 'h':
      return new Date(now.getTime() + value * 60 * 60 * 1000);
    case 'd':
      return new Date(now.getTime() + value * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Default to 7 days
  }
};
