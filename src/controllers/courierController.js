const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getAllInstitutions } = require('../utils/institutions');

// Жаңа курьер тапсырысын жасау
exports.createCourierOrder = async (req, res, next) => {
  try {
    const {
      fullName,
      phoneNumber,
      address,
      institution,
      deliveryTo,
      description,
    } = req.body;

    // Валидация
    if (!fullName || !phoneNumber || !address || !institution || !deliveryTo) {
      return res.status(400).json({
        success: false,
        message: 'Барлық міндетті өрістерді толтырыңыз',
      });
    }

    // Тапсырыс жасау
    const order = await prisma.courierOrder.create({
      data: {
        fullName,
        phoneNumber,
        address,
        institution,
        deliveryTo,
        description,
        userId: req.user?.id, // Егер пайдаланушы тіркелген болса
      },
    });

    res.status(201).json({
      success: true,
      message: 'Курьер тапсырысы сәтті жасалды',
      data: order,
      orderId: order.id,
    });
  } catch (error) {
    next(error);
  }
};

// Мекемелер тізімін алу (dropdown үшін)
exports.getInstitutions = (req, res, next) => {
  try {
    const institutions = getAllInstitutions();

    // Тек қажетті деректерді жіберу
    const simplifiedInstitutions = institutions.map((inst) => ({
      id: inst.id,
      name: inst.name,
      code: inst.code,
    }));

    res.status(200).json({
      success: true,
      count: institutions.length,
      data: simplifiedInstitutions,
    });
  } catch (error) {
    next(error);
  }
};

// Барлық курьер тапсырыстарын алу (Admin)
exports.getAllCourierOrders = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      startDate,
      endDate,
      search,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Фильтр құру
    const where = {};

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
        { institution: { contains: search, mode: 'insensitive' } },
        { deliveryTo: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Тапсырыстарды алу
    const orders = await prisma.courierOrder.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Жалпы саны
    const total = await prisma.courierOrder.count({ where });

    // Статистика
    const stats = {
      total,
      pending: await prisma.courierOrder.count({
        where: { ...where, status: 'PENDING' },
      }),
      processing: await prisma.courierOrder.count({
        where: { ...where, status: 'PROCESSING' },
      }),
      delivered: await prisma.courierOrder.count({
        where: { ...where, status: 'DELIVERED' },
      }),
      cancelled: await prisma.courierOrder.count({
        where: { ...where, status: 'CANCELLED' },
      }),
    };

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// Бір тапсырысты алу
exports.getCourierOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.courierOrder.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Тапсырыс табылмады',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// Тапсырыс статусын жаңарту (Admin)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'PROCESSING', 'DELIVERED', 'CANCELLED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Жарамсыз статус',
      });
    }

    const order = await prisma.courierOrder.findUnique({
      where: { id: parseInt(id) },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Тапсырыс табылмады',
      });
    }

    const updatedOrder = await prisma.courierOrder.update({
      where: { id: parseInt(id) },
      data: { status },
    });

    res.status(200).json({
      success: true,
      message: 'Тапсырыс статусы жаңартылды',
      data: updatedOrder,
    });
  } catch (error) {
    next(error);
  }
};

// Тапсырысты жою (Admin)
exports.deleteCourierOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await prisma.courierOrder.findUnique({
      where: { id: parseInt(id) },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Тапсырыс табылмады',
      });
    }

    await prisma.courierOrder.delete({
      where: { id: parseInt(id) },
    });

    res.status(200).json({
      success: true,
      message: 'Тапсырыс сәтті жойылды',
    });
  } catch (error) {
    next(error);
  }
};

// Менің тапсырыстарым (егер пайдаланушы тіркелген болса)
exports.getMyCourierOrders = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Авторизация қажет',
      });
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await prisma.courierOrder.findMany({
      where: { userId: req.user.id },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    });

    const total = await prisma.courierOrder.count({
      where: { userId: req.user.id },
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};
