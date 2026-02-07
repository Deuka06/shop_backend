const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getAllCategories = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        categoryName: true,
        slug: true,
        imageUrl: true,
      },
      orderBy: { createdAt: "desc" }, // displayOrder орнына датамен реттеу
    });

    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

exports.getCategoryTree = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { categoryName: "asc" },
    });

    const buildTree = (parentId = null) => {
      return categories
        .filter((category) => category.parentId === parentId)
        .map((category) => ({
          id: category.id,
          categoryName: category.categoryName,
          slug: category.slug,
          imageUrl: category.imageUrl,
          children: buildTree(category.id),
        }));
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
    const { categoryName, slug, parentId } = req.body;

    if (!categoryName) {
      return res
        .status(400)
        .json({ success: false, message: "Категория атауын енгізіңіз" });
    }

    // ЖАҢА: Егер файл жүктелсе, S3 сілтемесін аламыз, әйтпесе body-ден келгенді қолданамыз
    const finalImageUrl = req.file ? req.file.location : req.body.imageUrl;

    const category = await prisma.category.create({
      data: {
        categoryName,
        slug,
        parentId: parentId ? parseInt(parentId) : null,
        imageUrl: finalImageUrl, // Осы жерге PS.kz сілтемесі түседі
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
          select: {
            id: true,
            categoryName: true,
            slug: true,
            imageUrl: true,
          },
          orderBy: { categoryName: "asc" },
        },
      },
    });

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Категория табылмады" });
    }

    res.status(200).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { categoryName, slug, parentId } = req.body;

    const existingCategory = await prisma.category.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingCategory) {
      return res
        .status(404)
        .json({ success: false, message: "Категория табылмады" });
    }

    // ЖАҢА: Егер жаңа файл келсе, соны аламыз. Келмесе, бұрынғы imageUrl қала береді.
    const finalImageUrl = req.file ? req.file.location : req.body.imageUrl;

    const updateData = {
      categoryName,
      slug,
      imageUrl: finalImageUrl,
    };

    if (parentId !== undefined) {
      const pId = parentId ? parseInt(parentId) : null;
      if (pId === parseInt(id)) {
        return res.status(400).json({
          success: false,
          message: "Категория өз-өзіне ана болуы мүмкін емес",
        });
      }
      updateData.parentId = pId;
    }

    const updatedCategory = await prisma.category.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    res.status(200).json({
      success: true,
      message: "Категория жаңартылды",
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
      include: { children: true },
    });

    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Категория табылмады" });
    }

    if (category.children.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Бұл категорияның ішкі тармақтары бар. Алдымен оларды өшіріңіз.",
      });
    }

    await prisma.category.delete({ where: { id: parseInt(id) } });

    res.status(200).json({ success: true, message: "Категория жойылды" });
  } catch (error) {
    next(error);
  }
};
