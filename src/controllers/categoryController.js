const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        categoryName: true,
      },
      orderBy: { displayOrder: "asc" },
    });

    const formattedData = categories.map((cat) => ({
      id: cat.id,
      categoryName: cat.categoryName,
    }));

    res.status(200).json(formattedData);
  } catch (error) {
    next(error);
  }
};

exports.getCategoryTree = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { categoryName: "asc" }],
    });

    const buildTree = (parentId = null) => {
      return categories
        .filter((category) => category.parentId === parentId)
        .map((category) => ({
          id: category.id,
          categoryName: category.categoryName,
          slug: category.slug,
          description: category.description,
          imageUrl: category.imageUrl,
          displayOrder: category.displayOrder,
          children: buildTree(category.id),
        }))
        .sort((a, b) => a.displayOrder - b.displayOrder);
    };

    const categoryTree = buildTree();

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categoryTree,
    });
  } catch (error) {
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const {
      categoryName, // name емес
      description,
      parentId,
      isActive = true,
      imageUrl,
      displayOrder = 0,
    } = req.body;

    if (!categoryName) {
      return res
        .status(400)
        .json({ success: false, message: "Категория атауын енгізіңіз" });
    }

    // Slug жасау үшін де categoryName қолданамыз
    const slug = categoryName
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/--+/g, "-");

    const category = await prisma.category.create({
      data: {
        categoryName, // Базадағы жаңа өріс атауы
        description,
        slug,
        parentId: parentId ? parseInt(parentId) : null,
        isActive,
        imageUrl,
        displayOrder: parseInt(displayOrder),
      },
    });

    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

exports.getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        parent: {
          select: {
            id: true,
            categoryName: true,
            slug: true,
          },
        },
        children: {
          where: { isActive: true },
          select: {
            id: true,
            categoryName: true,
            slug: true,
            description: true,
            imageUrl: true,
            displayOrder: true,
          },
          orderBy: [{ displayOrder: "asc" }, { categoryName: "asc" }],
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Категория табылмады",
      });
    }

    res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Категория табылмады",
      });
    }

    if (updateData.name && updateData.name !== category.name) {
      updateData.slug = updateData.name
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/--+/g, "-");

      const existingSlug = await prisma.category.findFirst({
        where: {
          slug: updateData.slug,
          id: { not: parseInt(id) },
        },
      });

      if (existingSlug) {
        return res.status(400).json({
          success: false,
          message: "Бұл slug қолданыста",
        });
      }
    }

    if (updateData.parentId !== undefined) {
      const parentId = updateData.parentId
        ? parseInt(updateData.parentId)
        : null;

      if (parentId === parseInt(id)) {
        return res.status(400).json({
          success: false,
          message: "Категория өз-өзіне ана болуы мүмкін емес",
        });
      }

      if (parentId) {
        const parentCategory = await prisma.category.findUnique({
          where: { id: parentId },
        });

        if (!parentCategory) {
          return res.status(400).json({
            success: false,
            message: "Ана категория табылмады",
          });
        }
      }

      updateData.parentId = parentId;
    }

    if (updateData.displayOrder !== undefined) {
      updateData.displayOrder = parseInt(updateData.displayOrder);
    }

    const updatedCategory = await prisma.category.update({
      where: { id: parseInt(id) },
      data: updateData,
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

    res.status(200).json({
      success: true,
      message: "Категория сәтті жаңартылды",
      data: updatedCategory,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
      include: {
        children: {
          where: { isActive: true },
        },
      },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Категория табылмады",
      });
    }

    if (category.children.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Бұл категорияның белсенді бала категориялары бар. Алдымен оларды өшіріңіз.",
      });
    }

    await prisma.category.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({
      success: true,
      message: "Категория сәтті жойылды",
    });
  } catch (error) {
    next(error);
  }
};

exports.toggleCategoryActive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Категория табылмады",
      });
    }

    const updatedCategory = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { isActive },
    });

    res.status(200).json({
      success: true,
      message: isActive
        ? "Категория белсендірілді"
        : "Категория белсендірілмеді",
      data: updatedCategory,
    });
  } catch (error) {
    next(error);
  }
};
