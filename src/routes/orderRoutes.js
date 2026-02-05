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

// Клиент үшін: Тапсырыс беру
router.post("/create", authenticate, orderController.createOrder);

// Клиент үшін: Өз тапсырыстарын көру (Тарих)
router.get("/my", authenticate, orderController.getMyOrders);

// Админ үшін: Барлық тапсырыстарды көру
router.get("/all", authenticate, authorize("ADMIN"), async (req, res) => {
  const orders = await prisma.order.findMany({ include: { items: true } });
  res.json({ success: true, data: orders });
});

// Админ үшін: Статусты өзгерту (Мысалы: Тексерілді -> Қабылданды)
/**
 * @swagger
 * /orders/{id}/status:
 *   patch:
 *     summary: Тапсырыс статусын өзгерту (Тексеруден өткізу)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  "/:id/status",
  authenticate,
  authorize("ADMIN"),
  orderController.updateStatus,
);

module.exports = router;
