// generateToken.js
import jwt from 'jsonwebtoken';

/**
 * @desc    Generate a secure JWT Token
 * @param   {String} id - User ID from MongoDB
 * @returns {String} Signed JWT Token
 */
const generateToken = (id) => {
    // jwt.sign(payload, secret, options)
    return jwt.sign(
        { id }, 
        process.env.JWT_SECRET || 'dharashakti_super_secret_key_2026', 
        {
            expiresIn: '30d', // 30 din tak login rahega (ERP ke liye convenient hai)
        }
    );
};

export default generateToken;