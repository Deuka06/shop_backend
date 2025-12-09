const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Барлық өнімдерді алу
exports.getAllProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Фильтр құру
    const where = {};

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Өнімдерді алу
    const products = await prisma.product.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Жалпы саны
    const total = await prisma.product.count({ where });

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// Бір өнімді алу
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Өнім табылмады',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Жаңа өнім қосу (ADMIN немесе сатушы)
exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, category, image } = req.body;

    // Өнімді қосу
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        category,
        image,
        userId: req.user.id,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Өнім сәтті қосылды',
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// Өнімді жаңарту
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Өнімді табу
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Өнім табылмады',
      });
    }

    // Өнім иесі немесе ADMIN тек жаңарта алады
    if (product.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Бұл өнімді өңдеуге рұқсатыңыз жоқ',
      });
    }

    // Өнімді жаңарту
    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: 'Өнім сәтті жаңартылды',
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

// Өнімді жою
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Өнімді табу
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Өнім табылмады',
      });
    }

    // Тек ADMIN жоя алады
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Өнімді жоюға рұқсатыңыз жоқ',
      });
    }

    // Өнімді жою
    await prisma.product.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({
      success: true,
      message: 'Өнім сәтті жойылды',
    });
  } catch (error) {
    next(error);
  }
};
