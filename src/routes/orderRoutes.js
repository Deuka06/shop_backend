const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { authenticate, authorize } = require("../middlewares/auth");

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Тапсырыстарды басқару (Төлем және Статус)
 */

/**
 * @swagger
 * /orders/create:
 *   post:
 *     summary: Жаңа тапсырыс жасау (Клиент үшін)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerName
 *               - phoneNumber
 *               - institutionsId
 *               - deliveryTo
 *               - totalAmount
 *               - items
 *             properties:
 *               customerName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               institutionsId:
 *                 type: number
 *               deliveryTo:
 *                 type: string
 *               totalAmount:
 *                 type: number
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     price:
 *                       type: number
 *     responses:
 *       201:
 *         description: Тапсырыс жасалды
 */
router.post("/create", authenticate, orderController.createOrder);

/**
 * @swagger
 * /orders/all:
 *   get:
 *    summary: Барлық тапсырыстар тізімі (Админ үшін)
 *    tags: [Orders]
 *    security:
 *      - bearerAuth: []
 *    responses:
 *      200:
 *        description: Барлық тапсырыстар сәтті алынды
 */
router.get(
  "/all",
  authenticate,
  authorize("ADMIN"),
  orderController.getAllOrders,
);

/**
 * @swagger
 * /orders/my:
 *   get:
 *     summary: Менің тапсырыстар тарихым
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *           description: Пайдаланушының ID нөмірі
 *     responses:
 *       200:
 *         description: Тапсырыстар тізімі
 */
router.get("/my", authenticate, orderController.getMyOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *    summary: Нақты бір тапсырыс туралы ақпарат алу
 *    tags: [Orders]
 *    security:
 *      - bearerAuth: []
 *    parameters:
 *      - in: path
 *        name: id
 *        required: true
 *        schema:
 *          type: integer
 *        description: Тапсырыстың ID нөмірі
 *    responses:
 *      200:
 *        description: Тапсырыс мәліметтері алынды
 */
router.get("/:id", authenticate, orderController.getOrderById);

/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Тапсырыс статусын өзгерту (Админ үшін)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           description: Тапсырыстың ID нөмірі
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, ACCEPTED, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: Статус сәтті жаңартылды
 */
router.patch(
  "/:id/status",
  authenticate,
  authorize("ADMIN"),
  orderController.updateStatus,
);

module.exports = router;
