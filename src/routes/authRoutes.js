const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: Автоматты ID
 *         email:
 *           type: string
 *           format: email
 *         name:
 *           type: string
 *         role:
 *           type: string
 *           enum: [USER, ADMIN]
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         token:
 *           type: string
 *         user:
 *           $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Аутентификация API
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Жаңа пайдаланушыны тіркеу
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: Тіркеу сәтті
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Қате деректер
 */
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Жарамды email енгізіңіз'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Пароль 6 таңбадан кем емес болуы керек'),
    body('name').notEmpty().withMessage('Атыңызды енгізіңіз'),
  ],
  authController.register
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Жүйеге кіру
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Кіру сәтті
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Қате email немесе пароль
 */
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Жарамды email енгізіңіз'),
    body('password').notEmpty().withMessage('Пароль енгізіңіз'),
  ],
  authController.login
);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Жүйеден шығу
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Шығу сәтті
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @swagger
 * /api/v1/auth/profile:
 *   get:
 *     summary: Пайдаланушы профилін алу
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Профиль деректері
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 */
router.get('/profile', authenticate, authController.getProfile);

module.exports = router;
