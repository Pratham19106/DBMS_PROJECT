const jwt = require('jsonwebtoken')
require('dotenv').config();
const authMiddleware =  (req , res , next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]

    if(!token){
        const err = new Error("NO access")
        err.status = 401
        return next(err)
    }

    const tokenInfo = jwt.verify(token , process.env.JWT_SECRET)
    req.user = tokenInfo
    next();
}

module.exports = authMiddleware;

