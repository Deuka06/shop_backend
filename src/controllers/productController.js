const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      categoryId,
      categorySlug,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      minPrice,
      maxPrice,
      inStock,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    } else if (categorySlug) {
      const category = await prisma.category.findFirst({
        where: { slug: categorySlug, isActive: true },
      });

      if (category) {
        where.categoryId = category.id;
      } else {
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          totalPages: 0,
          currentPage: parseInt(page),
          data: [],
        });
      }
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (inStock === 'true') {
      where.stock = { gt: 0 };
    } else if (inStock === 'false') {
      where.stock = 0;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy = {};
    if (sortBy === 'price') {
      orderBy.price = sortOrder;
    } else if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const products = await prisma.product.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
          },
        },
      },
    });

    const total = await prisma.product.count({ where });

    let categoryInfo = null;
    if (categoryId || categorySlug) {
      const category = await prisma.category.findFirst({
        where: {
          OR: [
            { id: categoryId ? parseInt(categoryId) : undefined },
            { slug: categorySlug },
          ],
          isActive: true,
        },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      if (category) {
        categoryInfo = {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          parent: category.parent,
        };
      }
    }

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      category: categoryInfo,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

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
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            imageUrl: true,
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

exports.createProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, categoryId, image } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Өнім атауы мен бағасы міндетті өріс',
      });
    }

    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: parseInt(categoryId) },
      });

      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Категория табылмады',
        });
      }
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock) || 0,
        image,
        userId: req.user.id,
        categoryId: categoryId ? parseInt(categoryId) : null,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
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

exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Өнім табылмады',
      });
    }

    if (product.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Бұл өнімді өңдеуге рұқсатыңыз жоқ',
      });
    }

    if (updateData.categoryId !== undefined) {
      const categoryId = updateData.categoryId
        ? parseInt(updateData.categoryId)
        : null;

      if (categoryId) {
        const category = await prisma.category.findUnique({
          where: { id: categoryId },
        });

        if (!category) {
          return res.status(400).json({
            success: false,
            message: 'Категория табылмады',
          });
        }
      }

      updateData.categoryId = categoryId;
    }

    if (updateData.price !== undefined) {
      updateData.price = parseFloat(updateData.price);
    }
    if (updateData.stock !== undefined) {
      updateData.stock = parseInt(updateData.stock);
    }

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
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

exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Өнім табылмады',
      });
    }

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Өнімді жоюға рұқсатыңыз жоқ',
      });
    }

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

exports.getProductsByCategory = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const category = await prisma.category.findFirst({
      where: { slug, isActive: true },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Категория табылмады',
      });
    }

    const allCategoryIds = [category.id];
    if (category.children && category.children.length > 0) {
      allCategoryIds.push(...category.children.map((child) => child.id));
    }

    const products = await prisma.product.findMany({
      where: {
        categoryId: {
          in: allCategoryIds,
        },
      },
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
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    const total = await prisma.product.count({
      where: {
        categoryId: {
          in: allCategoryIds,
        },
      },
    });

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        parent: category.parent,
        children: category.children,
      },
      data: products,
    });
  } catch (error) {
    next(error);
  }
};
