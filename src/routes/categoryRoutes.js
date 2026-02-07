const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const categoryController = require("../controllers/categoryController");
const { authenticate, authorize } = require("../middlewares/auth");
const upload = require("../services/s3Service");

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Өнім категорияларын басқару
 */

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Барлық категорияларды алу
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Категориялар тізімі сәтті алынды
 */
router.get("/", categoryController.getAllCategories);

/**
 * @swagger
 * /categories/tree:
 *   get:
 *     summary: Категориялар ағашын алу
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Категориялар ағашы
 */
router.get("/tree", categoryController.getCategoryTree);

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Жаңа категория құру (Суретпен бірге)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:  # МАҢЫЗДЫ: Сурет жіберу үшін түрін өзгерту керек
 *           schema:
 *             type: object
 *             properties:
 *               categoryName:
 *                 type: string
 *               slug:
 *                 type: string
 *               parentId:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary # Сурет файлы
 *     responses:
 *       201:
 *         description: Категория сәтті құрылды
 */
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  upload.single("image"), // ЖАҢА: Суретті PS.kz-ке жүктеу
  [
    body("categoryName").notEmpty().withMessage("Категория атауын енгізіңіз"),
    body("slug")
      .notEmpty()
      .withMessage("Slug енгізіңіз")
      .matches(/^[a-z0-9-]+$/)
      .withMessage("Slug тек кіші әріптер мен сызықшадан тұруы керек"),
    body("parentId").optional().isInt(),
  ],
  categoryController.createCategory,
);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Бір категорияны алу
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Категория деректері
 */
router.get(
  "/:id",
  [param("id").isInt().withMessage("ID бүтін сан болуы керек")],
  categoryController.getCategoryById,
);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     summary: Категорияны жаңарту (Суретті қоса)
 *     tags: [Categories]
 *     requestBody:
 *       content:
 *         multipart/form-data:  # МАҢЫЗДЫ: JSON-нан multipart-қа ауыстырамыз
 *           schema:
 *             type: object
 *             properties:
 *               categoryName:
 *                 type: string
 *               slug:
 *                 type: string
 *               parentId:
 *                 type: integer
 *               image:
 *                 type: string
 *                 format: binary # imageUrl емес, image (файл)
 *     responses:
 *       200:
 *         description: Категория жаңартылды
 */
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  upload.single("image"),
  [
    param("id").isInt().withMessage("ID бүтін сан болуы керек"),
    body("categoryName").optional().notEmpty(),
    body("slug")
      .optional()
      .matches(/^[a-z0-9-]+$/),
    body("parentId").optional().isInt(),
    body("imageUrl").optional().isString(),
  ],
  categoryController.updateCategory,
);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     summary: Категорияны жою
 *     tags: [Categories]
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
 *         description: Категория жойылды
 */
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  [param("id").isInt().withMessage("ID бүтін сан болуы керек")],
  categoryController.deleteCategory,
);

module.exports = router;
