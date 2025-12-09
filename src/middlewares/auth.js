const jwt = require('jsonwebtoken');

exports.authenticate = async (req, res, next) => {
  try {
    // 1. Token-ді header-дан алу
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }
    // 2. Немесе cookie-дан алу
    else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Авторизация қажет. Токен табылмады.',
      });
    }

    // 3. Token тексеру
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Пайдаланушыны базадан табу
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Пайдаланушы табылмады.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Жарамсыз токен',
    });
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Бұл операция үшін рұқсатыңыз жоқ',
      });
    }
    next();
  };
};
