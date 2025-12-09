const { PrismaClient } = require('@prisma/client');
const JWTUtils = require('../utils/jwt');
const prisma = new PrismaClient();

exports.register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Пайдаланушы бар ма соны тексеру
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Бұл email бойынша пайдаланушы тіркелген',
      });
    }

    // Парольді хештеу
    const hashedPassword = await JWTUtils.hashPassword(password);

    // Жаңа пайдаланушы құру
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'USER', // Әдепкі рөл
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // JWT токен жасау
    const token = JWTUtils.generateToken(user);

    // Cookie-ге токен сақтау
    JWTUtils.setTokenCookie(res, token);

    res.status(201).json({
      success: true,
      message: 'Тіркеу сәтті аяқталды',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Пайдаланушыны табу
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Қате email немесе пароль',
      });
    }

    // Парольді тексеру
    const isPasswordValid = await JWTUtils.comparePassword(
      password,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Қате email немесе пароль',
      });
    }

    // Пайдаланушы деректерін дайындау (парольсіз)
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
    };

    // JWT токен жасау
    const token = JWTUtils.generateToken(userResponse);

    // Cookie-ге токен сақтау
    JWTUtils.setTokenCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Кіру сәтті',
      token,
      user: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res, next) => {
  try {
    // Cookie-ден токенді жою
    JWTUtils.clearTokenCookie(res);

    res.status(200).json({
      success: true,
      message: 'Шығу сәтті',
    });
  } catch (error) {
    next(error);
  }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};
