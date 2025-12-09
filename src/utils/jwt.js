const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class JWTUtils {
  // JWT токен жасау
  static generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
  }

  // Парольді хештеу
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  // Парольді тексеру
  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Cookie орнату
  static setTokenCookie(res, token) {
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 күн
      sameSite: 'strict',
    });
  }

  // Cookie тазалау
  static clearTokenCookie(res) {
    res.clearCookie('token');
  }
}

module.exports = JWTUtils;
