// src/routes/orderHistoryRoutes.js
const express = require("express");
const router = express.Router();
const orderHistoryController = require("../controllers/orderHistoryController");
const { auth } = require("../middlewares/auth");
const { body } = require("express-validator");
const { authenticate, authorize } = require("../middlewares/auth");

/**
 * @swagger
 * tags:
 *   name: Order History
 *   description: Тапсырыс тарихы мен трекинг
 */

/**
 * @swagger
 * /api/orders/history:
 *   get:
 *     summary: Пайдаланушының тапсырыс тарихы
 *     tags: [Order History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Тапсырыс тарихы тізімі
 */
router.get("/history", authenticate, orderHistoryController.getMyOrderHistory);

/**
 * @swagger
 * /api/orders/history/{orderId}:
 *   get:
 *     summary: Тапсырыстың толық мәліметтері
 *     tags: [Order History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Тапсырыс мәліметтері
 */
router.get(
  "/history/:orderId",
  authenticate,
  orderHistoryController.getOrderDetails
);

/**
 * @swagger
 * /api/orders/history/{orderNumber}/track:
 *   get:
 *     summary: Тапсырыс трекингі
 *     tags: [Order History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Тапсырыс статусы
 */
router.get(
  "/history/:orderNumber/track",
  authenticate,
  orderHistoryController.trackOrder
);

/**
 * @swagger
 * /api/orders/history/{orderId}/return:
 *   post:
 *     summary: Тапсырысты қайтарып алу
 *     tags: [Order History]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: Қайтару сұранысы қабылданды
 */
router.post(
  "/history/:orderId/return",
  authenticate,
  [body("reason").notEmpty().withMessage("Қайтару себебін көрсетіңіз")],
  orderHistoryController.returnOrder
);

/**
 * @swagger
 * /api/orders/history/stats:
 *   get:
 *     summary: Тапсырыс статистикасы
 *     tags: [Order History]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Пайдаланушы статистикасы
 */
router.get("/history/stats", authenticate, (req, res) => {
  // Статистика функциясын кейін қосасыз
  res.json({ message: "Stats endpoint" });
});

module.exports = router;
