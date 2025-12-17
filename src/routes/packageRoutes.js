const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const packageController = require('../controllers/packageController');
const { authenticate, authorize } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Packages
 *   description: Дайын посылкаларды басқару
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Package:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         name:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         originalPrice:
 *           type: number
 *         image:
 *           type: string
 *         isActive:
 *           type: boolean
 *         stock:
 *           type: integer
 *         weight:
 *           type: number
 *         dimensions:
 *           type: string
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     PackageItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         quantity:
 *           type: integer
 *         customPrice:
 *           type: number
 *         product:
 *           $ref: '#/components/schemas/Product'
 */

/**
 * @swagger
 * /packages:
 *   get:
 *     summary: Барлық посылкаларды алу
 *     tags: [Packages]
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
 *         name: categoryId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: Посылкалар тізімі
 */
router.get('/', packageController.getAllPackages);

/**
 * @swagger
 * /packages/{id}:
 *   get:
 *     summary: Бір посылканы алу
 *     tags: [Packages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Посылка деректері
 */
router.get('/:id', packageController.getPackageById);

/**
 * @swagger
 * /packages/{id}/details:
 *   get:
 *     summary: Посылканың толық детальдарын алу (клиент үшін)
 *     tags: [Packages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Посылка детальдары
 */
router.get('/:id/details', packageController.getPackageDetails);

/**
 * @swagger
 * /packages:
 *   post:
 *     summary: Жаңа посылка құру (ADMIN)
 *     tags: [Packages]
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
 *               - items
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               originalPrice:
 *                 type: number
 *               image:
 *                 type: string
 *               categoryId:
 *                 type: integer
 *               weight:
 *                 type: number
 *               dimensions:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     productId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     customPrice:
 *                       type: number
 *     responses:
 *       201:
 *         description: Посылка сәтті құрылды
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  [
    body('name').notEmpty().withMessage('Посылка атауын енгізіңіз'),
    body('price')
      .isFloat({ gt: 0 })
      .withMessage('Баға 0-ден үлкен болуы керек'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('Кем дегенде бір өнім қосу керек'),
  ],
  packageController.createPackage
);

/**
 * @swagger
 * /packages/{id}/items:
 *   post:
 *     summary: Посылкаға өнім қосу (ADMIN)
 *     tags: [Packages]
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
 *               - productId
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               productId:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *                 default: 1
 *               customPrice:
 *                 type: number
 *     responses:
 *       201:
 *         description: Өнім посылкаға қосылды
 */
router.post(
  '/:id/items',
  authenticate,
  authorize('ADMIN'),
  [
    param('id').isInt(),
    body('productId').isInt(),
    body('quantity').optional().isInt({ min: 1 }),
  ],
  packageController.addItemToPackage
);

/**
 * @swagger
 * /packages/{packageId}/items/{itemId}:
 *   delete:
 *     summary: Посылкадан өнімді алып тастау (ADMIN)
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: packageId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Өнім посылкадан алынып тасталды
 */
router.delete(
  '/:packageId/items/:itemId',
  authenticate,
  authorize('ADMIN'),
  [param('packageId').isInt(), param('itemId').isInt()],
  packageController.removeItemFromPackage
);

/**
 * @swagger
 * /packages/{id}:
 *   put:
 *     summary: Посылканы жаңарту (ADMIN)
 *     tags: [Packages]
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
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               originalPrice:
 *                 type: number
 *               image:
 *                 type: string
 *               categoryId:
 *                 type: integer
 *               weight:
 *                 type: number
 *               dimensions:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *               stock:
 *                 type: integer
 *               userId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Посылка сәтті жаңартылды
 *       404:
 *         description: Посылка табылмады
 */
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  [
    param('id').isInt().withMessage('Жарамсыз посылка ID'),
    body('name').notEmpty().withMessage('Посылка атауын енгізіңіз'),
    body('price')
      .isFloat({ gt: 0 })
      .withMessage('Баға 0-ден үлкен болуы керек'),
  ],
  packageController.updatePackage
);

/**
 * @swagger
 * /packages/{packageId}/items/{itemId}:
 *   put:
 *     summary: Посылкадағы өнімді жаңарту (ADMIN)
 *     tags: [Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: packageId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: itemId
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
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               customPrice:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Өнім сәтті жаңартылды
 *       404:
 *         description: Өнім посылкада табылмады
 */
router.put(
  '/:packageId/items/:itemId',
  authenticate,
  authorize('ADMIN'),
  [
    param('packageId').isInt().withMessage('Жарамсыз посылка ID'),
    param('itemId').isInt().withMessage('Жарамсыз өнім ID'),
    body('quantity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Саны 1-ден кем болмауы керек'),
    body('customPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Жеке баға 0-ден кем болмауы керек'),
  ],
  packageController.updatePackageItem
);

module.exports = router;
