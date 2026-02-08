const express = require("express");
const router = express.Router();
const { body, param, query } = require("express-validator");
const productController = require("../controllers/productController");
const { authenticate, authorize } = require("../middlewares/auth");
const upload = require("../services/s3Service");

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
 *     summary: Жаңа өнім қосу (Суретпен бірге)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *         content:
 *           multipart/form-data:  # JSON-нан multipart-қа өзгерттік
 *             schema:
 *               type: object
 *               required:
 *                 - name
 *                 - price
 *               properties:
 *                 name:
 *                   type: string
 *                   description: Өнім атауы
 *                 price:
 *                   type: number
 *                   description: Өнім бағасы
 *                 categoryId:
 *                   type: integer
 *                   description: Өнім категориясының ID-сі
 *                 image:
 *                   type: string
 *                   format: binary
 *                   description: Өнім суреті (файл)
 *     responses:
 *       201:
 *         description: Өнім сәтті құрылды
 */
router.post(
  "/",
  authenticate,
  authorize("ADMIN"), // "USER"-ден "ADMIN"-ге өзгерткен дұрыс шығар?
  upload.single("image"), // 'image' деген атпен келетін файлды қабылдау
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
 *     summary: Өнімді жаңарту (Мәтін немесе Сурет)
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               categoryId:
 *                 type: integer
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Өнім сәтті жаңартылды
 */
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  upload.single("image"), // 'image' кілтімен келетін файлды ұстайды
  [
    param("id").isInt().withMessage("ID сан болуы керек"),
    body("name").optional().notEmpty().withMessage("Атауы бос болмауы керек"),
    body("price")
      .optional()
      .isFloat({ gt: 0 })
      .withMessage("Баға 0-ден үлкен болуы керек"),
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
