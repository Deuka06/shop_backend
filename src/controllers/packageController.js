const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Барлық посылкаларды алу
exports.getAllPackages = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      categoryId,
      isActive = true,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { isActive: isActive === 'true' };

    if (categoryId) {
      where.categoryId = parseInt(categoryId);
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    const orderBy = {};
    if (sortBy === 'price') orderBy.price = sortOrder;
    else if (sortBy === 'name') orderBy.name = sortOrder;
    else orderBy.createdAt = sortOrder;

    const packages = await prisma.package.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    const total = await prisma.package.count({ where });

    res.status(200).json({
      success: true,
      count: packages.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: packages.map((pkg) => ({
        ...pkg,
        itemCount: pkg._count.items,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// Бір посылканы алу
exports.getPackageById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pkg = await prisma.package.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                image: true,
                description: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: 'Посылка табылмады',
      });
    }

    // Есептеулер
    const itemsWithTotal = pkg.items.map((item) => ({
      ...item,
      totalPrice: item.customPrice || item.product.price,
      itemTotal: (item.customPrice || item.product.price) * item.quantity,
    }));

    const originalTotal = itemsWithTotal.reduce(
      (sum, item) => sum + item.itemTotal,
      0
    );
    const discount = pkg.originalPrice
      ? pkg.originalPrice - pkg.price
      : originalTotal - pkg.price;
    const discountPercentage = pkg.originalPrice
      ? Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100)
      : Math.round(((originalTotal - pkg.price) / originalTotal) * 100);

    res.status(200).json({
      success: true,
      data: {
        ...pkg,
        items: itemsWithTotal,
        summary: {
          totalItems: pkg.items.length,
          totalProducts: pkg.items.reduce(
            (sum, item) => sum + item.quantity,
            0
          ),
          originalTotal: pkg.originalPrice || originalTotal,
          finalPrice: pkg.price,
          discount: discount > 0 ? discount : 0,
          discountPercentage: discountPercentage > 0 ? discountPercentage : 0,
          savings: discount > 0 ? `Сіз ${discount}₸ үнемдедіңіз` : null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Посылканың толық детальдарын алу (клиент үшін)
exports.getPackageDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const pkg = await prisma.package.findUnique({
      where: { id: parseInt(id), isActive: true },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
          },
        },
        items: {
          include: {
            product: {
              include: {
                category: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: 'Посылка табылмады немесе белсенді емес',
      });
    }

    // Детальды форматтау
    const formattedItems = pkg.items.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      description: item.product.description,
      price: item.customPrice || item.product.price,
      originalPrice: item.product.price,
      quantity: item.quantity,
      image: item.product.image,
      category: item.product.category,
      total: (item.customPrice || item.product.price) * item.quantity,
    }));

    const itemsTotal = formattedItems.reduce(
      (sum, item) => sum + item.total,
      0
    );
    const packagePrice = pkg.price;
    const savings = itemsTotal - packagePrice;

    res.status(200).json({
      success: true,
      data: {
        package: {
          id: pkg.id,
          name: pkg.name,
          description: pkg.description,
          price: packagePrice,
          originalPrice: pkg.originalPrice || itemsTotal,
          image: pkg.image,
          weight: pkg.weight,
          dimensions: pkg.dimensions,
          tags: pkg.tags,
          category: pkg.category,
          stock: pkg.stock,
          isActive: pkg.isActive,
        },
        items: formattedItems,
        summary: {
          totalItems: formattedItems.length,
          totalProducts: formattedItems.reduce(
            (sum, item) => sum + item.quantity,
            0
          ),
          itemsTotal: itemsTotal,
          packagePrice: packagePrice,
          savings: savings,
          savingsPercentage: Math.round((savings / itemsTotal) * 100),
          perProductSavings: Math.round(
            savings /
              formattedItems.reduce((sum, item) => sum + item.quantity, 0)
          ),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Жаңа посылка құру (ADMIN)
exports.createPackage = async (req, res, next) => {
  try {
    const {
      name,
      description,
      price,
      originalPrice,
      image,
      categoryId,
      weight,
      dimensions,
      tags,
      items, // [{productId: 1, quantity: 2, customPrice: 1000}, ...]
    } = req.body;

    if (!name || !price || !items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Атауы, бағасы және өнімдер тізімі міндетті',
      });
    }

    // Өнімдерді тексеру
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: parseInt(item.productId) },
      });

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Өнім ID ${item.productId} табылмады`,
        });
      }
    }

    // Посылка құру
    const newPackage = await prisma.package.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        image,
        categoryId: categoryId ? parseInt(categoryId) : null,
        weight: weight ? parseFloat(weight) : null,
        dimensions,
        tags: tags || [],
        userId: req.user?.id,
        items: {
          create: items.map((item) => ({
            productId: parseInt(item.productId),
            quantity: parseInt(item.quantity) || 1,
            customPrice: item.customPrice ? parseFloat(item.customPrice) : null,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Посылка сәтті құрылды',
      data: newPackage,
    });
  } catch (error) {
    next(error);
  }
};

// Посылкаға өнім қосу
exports.addItemToPackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { productId, quantity = 1, customPrice } = req.body;

    const pkg = await prisma.package.findUnique({
      where: { id: parseInt(id) },
    });

    if (!pkg) {
      return res.status(404).json({
        success: false,
        message: 'Посылка табылмады',
      });
    }

    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Өнім табылмады',
      });
    }

    const packageItem = await prisma.packageItem.create({
      data: {
        packageId: parseInt(id),
        productId: parseInt(productId),
        quantity: parseInt(quantity),
        customPrice: customPrice ? parseFloat(customPrice) : null,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Өнім посылкаға қосылды',
      data: packageItem,
    });
  } catch (error) {
    next(error);
  }
};

// Посылкадан өнімді алып тастау
exports.removeItemFromPackage = async (req, res, next) => {
  try {
    const { packageId, itemId } = req.params;

    const packageItem = await prisma.packageItem.findUnique({
      where: { id: parseInt(itemId) },
    });

    if (!packageItem || packageItem.packageId !== parseInt(packageId)) {
      return res.status(404).json({
        success: false,
        message: 'Өнім посылкада табылмады',
      });
    }

    await prisma.packageItem.delete({
      where: { id: parseInt(itemId) },
    });

    res.status(200).json({
      success: true,
      message: 'Өнім посылкадан алынып тасталды',
    });
  } catch (error) {
    next(error);
  }
};

// Посылканы жаңарту (PUT) - ADMIN
exports.updatePackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      originalPrice,
      image,
      categoryId,
      weight,
      dimensions,
      tags,
      isActive,
      stock,
      userId,
    } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Атауы және бағасы міндетті өрістер',
      });
    }

    // Посылка бар екенін тексеру
    const existingPackage = await prisma.package.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingPackage) {
      return res.status(404).json({
        success: false,
        message: 'Посылка табылмады',
      });
    }

    // Посылканы жаңарту
    const updatedPackage = await prisma.package.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description: description || null,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : null,
        image: image || null,
        categoryId: categoryId ? parseInt(categoryId) : null,
        weight: weight ? parseFloat(weight) : null,
        dimensions: dimensions || null,
        tags: tags || [],
        isActive:
          isActive !== undefined ? Boolean(isActive) : existingPackage.isActive,
        stock: stock ? parseInt(stock) : null,
        userId: userId ? parseInt(userId) : existingPackage.userId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                image: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Посылка сәтті жаңартылды',
      data: updatedPackage,
    });
  } catch (error) {
    next(error);
  }
};

// Посылкадағы өнімді жаңарту (PUT) - ADMIN
exports.updatePackageItem = async (req, res, next) => {
  try {
    const { packageId, itemId } = req.params;
    const { quantity, customPrice } = req.body;

    // Өнім бар екенін тексеру
    const existingItem = await prisma.packageItem.findUnique({
      where: { id: parseInt(itemId) },
      include: {
        product: true,
      },
    });

    if (!existingItem || existingItem.packageId !== parseInt(packageId)) {
      return res.status(404).json({
        success: false,
        message: 'Өнім посылкада табылмады',
      });
    }

    // Өнімді жаңарту
    const updatedItem = await prisma.packageItem.update({
      where: { id: parseInt(itemId) },
      data: {
        quantity:
          quantity !== undefined ? parseInt(quantity) : existingItem.quantity,
        customPrice:
          customPrice !== undefined
            ? parseFloat(customPrice)
            : existingItem.customPrice,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            image: true,
          },
        },
      },
    });

    // Жалпы құнды есептеу
    const itemPrice = updatedItem.customPrice || updatedItem.product.price;
    const totalPrice = itemPrice * updatedItem.quantity;

    res.status(200).json({
      success: true,
      message: 'Өнім сәтті жаңартылды',
      data: {
        ...updatedItem,
        itemPrice,
        totalPrice,
      },
    });
  } catch (error) {
    next(error);
  }
};
