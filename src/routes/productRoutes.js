const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const productController = require("../controllers/productController");
const { authenticate, authorize } = require("../middlewares/auth");

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Категория бойынша өнімдерді алу
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *           description: Тауарларды алу үшін категорияның ID-сін жіберу міндетті
 *     responses:
 *       200:
 *         description: Өнімдер тізімі
 */
router.get(
  "/",
  [
    query("categoryId")
      .notEmpty()
      .withMessage("categoryId жіберілуі тиіс")
      .isInt()
      .withMessage("categoryId сан болуы керек"),
  ],
  productController.getAllProducts,
);

/**
 * @swagger
 * /products/category/{slug}:
 *   get:
 *     summary: Категория бойынша өнімдерді алу
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Категория өнімдері
 */
router.get("/category/:slug", productController.getProductsByCategory);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Бір өнімді алу
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Өнім деректері
 */
router.get("/:id", productController.getProductById);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Жаңа өнім қосу
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               categoryId:
 *                 type: integer
 *               image:
 *                 type: string
 *     responses:
 *       201:
 *         description: Өнім сәтті қосылды
 */
router.post(
  "/",
  authenticate,
  authorize("USER"),
  [
    body("name").notEmpty().withMessage("Өнім атауын енгізіңіз"),
    body("price")
      .isFloat({ gt: 0 })
      .withMessage("Баға 0-ден үлкен болуы керек"),
    body("categoryId").optional().isInt(),
  ],
  productController.createProduct,
);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Өнімді жаңарту
 *     tags: [Products]
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
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Өнім сәтті жаңартылды
 */
router.put(
  "/:id",
  authenticate,
  authorize(["ADMIN", "SELLER"]),
  [
    param("id").isInt(),
    body("name").optional().notEmpty(),
    body("price").optional().isFloat({ gt: 0 }),
    body("categoryId").optional().isInt(),
  ],
  productController.updateProduct,
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Өнімді жою
 *     tags: [Products]
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
 *         description: Өнім жойылды
 */
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  [param("id").isInt()],
  productController.deleteProduct,
);

module.exports = router;
