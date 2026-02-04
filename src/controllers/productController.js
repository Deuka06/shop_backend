const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getAllProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      categoryId,
      categorySlug,
      sortBy = "createdAt",
      sortOrder = "desc",
      search,
      minPrice,
      maxPrice,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

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
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const orderBy = {};
    if (sortBy === "price") {
      orderBy.price = sortOrder;
    } else if (sortBy === "name") {
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
        // user: {
        //   select: {
        //     id: true,
        //     name: true,
        //     email: true,
        //   },
        // },
        category: {
          select: {
            id: true,
            categoryName: true,
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
              categoryName: true,
              slug: true,
            },
          },
        },
      });

      if (category) {
        categoryInfo = {
          id: category.id,
          categoryName: category.categoryName,
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
        // user: {
        //   select: {
        //     id: true,
        //     name: true,
        //     email: true,
        //   },
        // },
        category: {
          select: {
            id: true,
            categoryName: true,
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
        message: "Өнім табылмады",
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
    const { name, description, price, categoryId, image } = req.body;

    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: "Өнім атауы мен бағасы міндетті өріс",
      });
    }

    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: parseInt(categoryId) },
      });

      if (!category) {
        return res.status(400).json({
          success: false,
          message: "Категория табылмады",
        });
      }
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        image,
        userId: req.user.id,
        categoryId: categoryId ? parseInt(categoryId) : null,
      },
      include: {
        category: {
          select: {
            id: true,
            categoryName: true,
            slug: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Өнім сәтті қосылды",
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    // req.body-ден тек қажетті өрістерді бөліп аламыз
    const { name, description, price, categoryId, image, stock } = req.body;

    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Өнім табылмады" });
    }

    // Рұқсатты тексеру (бұрынғыша)
    if (product.userId !== req.user.id && req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, message: "Рұқсатыңыз жоқ" });
    }

    // Жаңартылатын деректер объектісін жинаймыз
    const dataToUpdate = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (description !== undefined) dataToUpdate.description = description;
    if (price !== undefined) dataToUpdate.price = parseFloat(price);
    if (stock !== undefined) dataToUpdate.stock = parseInt(stock);
    if (image !== undefined) dataToUpdate.image = image;

    if (categoryId !== undefined) {
      dataToUpdate.categoryId = categoryId ? parseInt(categoryId) : null;
    }

    const updatedProduct = await prisma.product.update({
      where: { id: parseInt(id) },
      data: dataToUpdate,
      // МЫНА ЖЕРГЕ НАЗАР АУДАР:
      include: {
        category: {
          select: {
            id: true,
            categoryName: true, // Prisma моделінде 'name' емес, 'categoryName' болуы мүмкін
            slug: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Өнім сәтті жаңартылды",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Update Error:", error);
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
        message: "Өнім табылмады",
      });
    }

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Өнімді жоюға рұқсатыңыз жоқ",
      });
    }

    await prisma.product.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({
      success: true,
      message: "Өнім сәтті жойылды",
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
      sortBy = "createdAt",
      sortOrder = "desc",
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
        message: "Категория табылмады",
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
