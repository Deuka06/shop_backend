const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const categoryController = require("../controllers/categoryController");
const { authenticate, authorize } = require("../middlewares/auth");

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Өнім категорияларын басқару
 */

/**
 * @swagger
 *  /categories:
 *    get:
 *      summary: Барлық категорияларды алу
 *      tags: [Categories]
 *      responses:
 *        200:
 *          description: Категориялар тізімі сәтті алынды
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  id:
 *                    type: integer
 *                    example: 1
 *                  categoryName:
 *                    type: string
 *                    example: "Электроника"
 *                slug:
 *                  type: string
 *                  example: "electronics"
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
 *  /categories:
 *    post:
 *      summary: Жаңа категория құру
 *      tags: [Categories]
 *      security:
 *        - bearerAuth: []
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - categoryName
 *                - slug
 *              properties:
 *                categoryName:
 *                  type: string
 *                  example: "Электроника"
 *                slug:
 *                  type: string
 *                  example: "electronics"
 *                description:
 *                  type: string
 *                  example: "Тұрмыстық техника және гаджеттер"
 *                parentId:
 *                  type: integer
 *                  nullable: true
 *                isActive:
 *                  type: boolean
 *                  example: true
 *                displayOrder:
 *                  type: integer
 *                  example: 1
 *              responses:
 *                201:
 *                  description: Категория сәтті құрылды
 */
router.post(
  "/",
  authenticate,
  authorize("ADMIN"),
  [
    body("categoryName").notEmpty().withMessage("Категория атауын енгізіңіз"),
    body("slug")
      .notEmpty()
      .withMessage("Slug енгізіңіз (мысалы: electronics)")
      .matches(/^[a-z0-9-]+$/)
      .withMessage("Slug тек кіші әріптер, сандар және сызықшадан тұруы керек"),
    body("description").optional(),
    body("parentId").optional().isInt(),
    body("isActive").optional().isBoolean(),
    body("imageUrl").optional().isURL(),
    body("metaTitle").optional(),
    body("metaDescription").optional(),
    body("displayOrder").optional().isInt(),
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
  [param("id").isInt().withMessage("Категория ID бүтін сан болуы керек")],
  categoryController.getCategoryById,
);

/**
 * @swagger
 *  /categories/{id}:
 *    put:
 *      summary: Категорияны жаңарту
 *      tags: [Categories]
 *      security:
 *        - bearerAuth: []
 *      parameters:
 *        - in: path
 *          name: id
 *          required: true
 *          schema:
 *            type: integer
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                categoryName:
 *                  type: string
 *                slug:
 *                  type: string
 *                description:
 *                  type: string
 *                parentId:
 *                  type: integer
 *                isActive:
 *                  type: boolean
 *                imageUrl:
 *                  type: string
 *                metaTitle:
 *                  type: string
 *                metaDescription:
 *                  type: string
 *                displayOrder:
 *                  type: integer
 *              responses:
 *                200:
 *                  description: Категория сәтті жаңартылды
 */
router.put(
  "/:id",
  authenticate,
  authorize("ADMIN"),
  [
    param("id").isInt().withMessage("Категория ID бүтін сан болуы керек"),
    body("categoryName").optional().notEmpty(),
    body("slug")
      .optional()
      .matches(/^[a-z0-9-]+$/),
    body("description").optional(),
    body("parentId").optional().isInt(),
    body("isActive").optional().isBoolean(),
    body("imageUrl").optional().isURL(),
    body("metaTitle").optional(),
    body("metaDescription").optional(),
    body("displayOrder").optional().isInt(),
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
  [param("id").isInt().withMessage("Категория ID бүтін сан болуы керек")],
  categoryController.deleteCategory,
);

/**
 * @swagger
 * /categories/{id}/activate:
 *   patch:
 *     summary: Категорияны белсендіру/белсендірмеу
 *     tags: [Categories]
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
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Категория статусы жаңартылды
 */
router.patch(
  "/:id/activate",
  authenticate,
  authorize("ADMIN"),
  [param("id").isInt(), body("isActive").isBoolean()],
  categoryController.toggleCategoryActive,
);

module.exports = router;
