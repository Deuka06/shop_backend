const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const courierController = require("../controllers/courierController");
const { authenticate, authorize } = require("../middlewares/auth");

/**
 * @swagger
 * tags:
 *   name: Courier
 *   description: Курьер тапсырыстарын басқару
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     CourierOrder:
 *       type: object
 *       required:
 *         - fullName
 *         - phoneNumber
 *         - address
 *         - institution
 *         - deliveryTo
 *       properties:
 *         id:
 *           type: integer
 *         fullName:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         address:
 *           type: string
 *         institution:
 *           type: string
 *         deliveryTo:
 *           type: string
 *         description:
 *           type: string
 *         status:
 *           type: string
 *           enum: [PENDING, PROCESSING, DELIVERED, CANCELLED]
 *         userId:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     Institution:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         code:
 *           type: string
 *
 *     OrderStatus:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [PENDING, PROCESSING, DELIVERED, CANCELLED]
 */

/**
 * @swagger
 * /courier/institutions:
 *   get:
 *     summary: Мекемелер тізімін алу (Dropdown үшін)
 *     tags: [Courier]
 *     responses:
 *       200:
 *         description: Мекемелер тізімі
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Institution'
 */
router.get("/institutions", courierController.getInstitutions);

/**
 * @swagger
 * /courier/orders:
 *   post:
 *     summary: Жаңа курьер тапсырысын жасау
 *     tags: [Courier]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - phoneNumber
 *               - address
 *               - institution
 *               - deliveryTo
 *             properties:
 *               fullName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               address:
 *                 type: string
 *               institution:
 *                 type: string
 *               deliveryTo:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Тапсырыс сәтті жасалды
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/CourierOrder'
 */
router.post(
  "/orders",
  [
    body("fullName").notEmpty().withMessage("Аты-жөніңізді енгізіңіз"),
    body("phoneNumber").notEmpty().withMessage("Телефон нөміріңізді енгізіңіз"),
    body("address").notEmpty().withMessage("Мекен-жайыңызды енгізіңіз"),
    body("institution").notEmpty().withMessage("Мекемені таңдаңыз"),
    body("deliveryTo").notEmpty().withMessage("Кабылдаушының атын енгізіңіз"),
  ],
  courierController.createCourierOrder
);

/**
 * @swagger
 * /courier/orders/my:
 *   get:
 *     summary: Менің курьер тапсырыстарым
 *     tags: [Courier]
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
 *     responses:
 *       200:
 *         description: Менің тапсырыстарым
 */
router.get("/orders/my", authenticate, courierController.getMyCourierOrders);

/**
 * @swagger
 * /courier/orders:
 *   get:
 *     summary: Барлық курьер тапсырыстарын алу (Admin)
 *     tags: [Courier]
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
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PROCESSING, DELIVERED, CANCELLED]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
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
 *         description: Тапсырыстар тізімі
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 stats:
 *                   type: object
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CourierOrder'
 */
router.get(
  "/orders",
  authenticate,
  authorize("ADMIN"),
  courierController.getAllCourierOrders
);

/**
 * @swagger
 * /courier/orders/{id}:
 *   get:
 *     summary: Бір тапсырысты алу
 *     tags: [Courier]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Тапсырыс деректері
 */
router.get("/orders/:id", authenticate, courierController.getCourierOrderById);

/**
 * @swagger
 * /courier/orders/{id}/status:
 *   patch:
 *     summary: Тапсырыс статусын жаңарту (Admin)
 *     tags: [Courier]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/OrderStatus'
 *     responses:
 *       200:
 *         description: Статус жаңартылды
 */
router.patch(
  "/orders/:id/status",
  authenticate,
  authorize("ADMIN"),
  [
    param("id").isInt(),
    body("status").isIn(["PENDING", "PROCESSING", "DELIVERED", "CANCELLED"]),
  ],
  courierController.updateOrderStatus
);

/**
 * @swagger
 * /courier/orders/{id}:
 *   delete:
 *     summary: Тапсырысты жою (Admin)
 *     tags: [Courier]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Тапсырыс жойылды
 */
router.delete(
  "/orders/:id",
  authenticate,
  authorize("ADMIN"),
  courierController.deleteCourierOrder
);

module.exports = router;
