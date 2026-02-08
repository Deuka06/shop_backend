const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const axios = require("axios");

// Админге хабарлама жіберу функциясы
const sendAdminNotification = async (order, title) => {
  const BOT_TOKEN = "8562842923:AAH29_MTZxLh0Pl9M9QX3__PriCBYppdMtQ";
  const CHAT_ID = "5084198148";

  const message = `
${title}
----------------------------
🆔 Тапсырыс ID: #${order.id}
👤 Клиент: ${order.customerName}
📞 Телефон: ${order.phoneNumber}
💰 Сомасы: ${order.totalAmount} ₸
📍 Мекеме: ${order.institutionsId}
👤 Жеткізу: ${order.deliveryTo}

----------------------------
⚠️ Өтініш, төлемді тексеріп, сайттан статусты жаңартыңыз!
  `;

  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: "Markdown",
    });
  } catch (err) {
    console.error("Telegram Error:", err.message);
  }
};

// 1. Клиент тапсырыс жасайды
exports.createOrder = async (req, res) => {
  try {
    const {
      customerName,
      phoneNumber,
      institutionsId,
      deliveryTo,
      totalAmount,
      items,
    } = req.body;
    const order = await prisma.order.create({
      data: {
        customerName,
        phoneNumber,
        institutionsId,
        deliveryTo,
        totalAmount,
        userId: req.user.id, // Auth middleware-ден келеді
        status: "PENDING",
        items: { create: items },
      },
      include: { items: true },
    });

    await sendAdminNotification(order, "🔔 ЖАҢА ТАПСЫРЫС ТҮСТІ");
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Клиент өз тапсырыстарын көреді (Тарих)
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 3. Админ статусты өзгертеді (Тексерілді -> Қабылданды)
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // Мысалы: "ACCEPTED"

    const updatedOrder = await prisma.order.update({
      where: { id: Number(id) },
      data: { status },
    });

    res.status(200).json({
      success: true,
      message: `Статус ${status} күйіне өзгертілді`,
      data: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 4. Барлық тапсырыстарды алу (Тек Админ үшін)
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: true,
        User: { select: { email: true, name: true } }, // Тапсырыс берген қолданушы туралы ақпарат (міндетті емес)
      },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 5. Нақты бір тапсырысты ID бойынша алу
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Тапсырыс табылмады" });
    }

    // Қауіпсіздік үшін: егер админ емес болса және бұл оның өз тапсырысы болмаса — рұқсат бермеу
    if (req.user.role !== "ADMIN" && order.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Бұл ақпаратты көруге рұқсатыңыз жоқ",
      });
    }

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
