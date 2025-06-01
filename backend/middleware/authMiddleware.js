const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ 
        success: false,
        message: 'Authorization header tidak ditemukan' 
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Token tidak ditemukan' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Auth Error:', error);
    return res.status(401).json({ 
      success: false,
      message: 'Token tidak valid atau kadaluarsa' 
    });
  }
};

module.exports = authMiddleware;