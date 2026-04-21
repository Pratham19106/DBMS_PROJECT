const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const errorHandler = (err, req, res, next) => {
    const status = err.status || 500
    res.status(status).json({
        msg: err.message || "Internal Server Error"
    })
    console.log(err)
}


module.exports = { errorHandler }