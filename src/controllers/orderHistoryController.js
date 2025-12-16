// src/controllers/orderHistoryController.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const asyncHandler = require("../utils/asyncHandler");
const ErrorResponse = require("../utils/errorResponse");

/**
 * @desc    Ағымдағы пайдаланушының тапсырыс тарихы
 * @route   GET /api/orders/history
 * @access  Private
 */
exports.getMyOrderHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Query параметрлері
  const {
    page = 1,
    limit = 10,
    status,
    startDate,
    endDate,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Filter құру
  const where = { userId };

  if (status) {
    where.status = status;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  try {
    // Тапсырыстарды алу
    const orders = await prisma.order.findMany({
      where,
      include: {
        orderItems: {
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
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: parseInt(limit),
    });

    // Жалпы саны
    const total = await prisma.order.count({ where });

    // Статистика
    const statusStats = await prisma.order.groupBy({
      by: ["status"],
      where: { userId },
      _count: true,
    });

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      stats: {
        totalOrders: total,
        byStatus: statusStats.reduce((acc, curr) => {
          acc[curr.status] = curr._count;
          return acc;
        }, {}),
      },
      data: orders.map((order) => ({
        ...order,
        totalItems: order.orderItems.reduce(
          (sum, item) => sum + item.quantity,
          0
        ),
      })),
    });
  } catch (error) {
    console.error("Тапсырыс тарихын алу қатесі:", error);
    throw error;
  }
});

/**
 * @desc    Тапсырыстың толық мәліметтері
 * @route   GET /api/orders/history/:orderId
 * @access  Private
 */
exports.getOrderDetails = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;

  const order = await prisma.order.findFirst({
    where: {
      id: parseInt(orderId),
      userId,
    },
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              image: true,
              category: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });

  if (!order) {
    return next(new ErrorResponse("Тапсырыс табылмады", 404));
  }

  // Есептеулер
  const orderSummary = {
    ...order,
    itemsCount: order.orderItems.length,
    totalQuantity: order.orderItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    ),
    items: order.orderItems.map((item) => ({
      ...item,
      product: item.product,
      subtotal: item.price * item.quantity,
    })),
  };

  res.status(200).json({
    success: true,
    data: orderSummary,
  });
});

/**
 * @desc    Тапсырыс трекингі (қай жерде екенін көру)
 * @route   GET /api/orders/history/:orderNumber/track
 * @access  Private
 */
exports.trackOrder = asyncHandler(async (req, res) => {
  const { orderNumber } = req.params;
  const userId = req.user.id;

  const order = await prisma.order.findFirst({
    where: {
      orderNumber,
      userId,
    },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      totalAmount: true,
      shippingAddress: true,
      paymentStatus: true,
    },
  });

  if (!order) {
    return next(new ErrorResponse("Тапсырыс табылмады", 404));
  }

  // Статус тарихы (мысал)
  const statusHistory = getStatusHistory(order.status, order.createdAt);

  // Болжамды жеткізу күні
  const estimatedDelivery = calculateEstimatedDelivery(
    order.createdAt,
    order.status
  );

  res.status(200).json({
    success: true,
    data: {
      ...order,
      statusHistory,
      estimatedDelivery,
      currentStatus: getStatusDescription(order.status),
    },
  });
});

/**
 * @desc    Тапсырысты қайтарып алу (пәтер алу)
 * @route   POST /api/orders/history/:orderId/return
 * @access  Private
 */
exports.returnOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userId = req.user.id;
  const { reason, comments } = req.body;

  // Тапсырысты тексеру
  const order = await prisma.order.findFirst({
    where: {
      id: parseInt(orderId),
      userId,
      status: "DELIVERED",
    },
    include: {
      orderItems: true,
    },
  });

  if (!order) {
    return next(new ErrorResponse("Тапсырыс қайтарылмайды", 400));
  }

  // 30 күннен асқан тапсырысты қайтару мүмкін емес
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  if (order.createdAt < thirtyDaysAgo) {
    return next(
      new ErrorResponse("Тапсырысты қайтару мерзімі өтіп кеткен (30 күн)", 400)
    );
  }

  // Return жасау (базада returnRequests модельі болса)
  // Мұнда ReturnRequest модельі қосылған деп есептейміз

  res.status(200).json({
    success: true,
    message: "Тапсырыс қайтарылу сұранысы қабылданды",
    data: {
      orderId,
      reason,
      status: "PENDING_REVIEW",
    },
  });
});

// Көмекші функциялар
function getStatusHistory(status, createdAt) {
  const history = [
    { status: "PENDING", date: createdAt, description: "Тапсырыс қабылданды" },
  ];

  const statusFlow = ["PROCESSING", "SHIPPED", "DELIVERED"];
  const currentIndex = statusFlow.indexOf(status);

  if (currentIndex >= 0) {
    for (let i = 0; i <= currentIndex; i++) {
      const statusDate = new Date(createdAt);
      statusDate.setHours(statusDate.getHours() + (i + 1) * 24);
      history.push({
        status: statusFlow[i],
        date: statusDate,
        description: getStatusDescription(statusFlow[i]),
      });
    }
  }

  if (status === "CANCELLED") {
    history.push({
      status: "CANCELLED",
      date: new Date(),
      description: "Тапсырыс жойылды",
    });
  }

  return history;
}

function calculateEstimatedDelivery(createdAt, status) {
  const deliveryDate = new Date(createdAt);

  if (status === "PENDING" || status === "PROCESSING") {
    deliveryDate.setDate(deliveryDate.getDate() + 7); // 7 күннен кейін
  } else if (status === "SHIPPED") {
    deliveryDate.setDate(deliveryDate.getDate() + 3); // 3 күннен кейін
  } else {
    return null;
  }

  return deliveryDate;
}

function getStatusDescription(status) {
  const descriptions = {
    PENDING: "Тапсырыс қабылданды",
    PROCESSING: "Өңделуде",
    SHIPPED: "Жеткізуге берілді",
    DELIVERED: "Жеткізілді",
    CANCELLED: "Жойылды",
  };

  return descriptions[status] || status;
}

module.exports = exports;
