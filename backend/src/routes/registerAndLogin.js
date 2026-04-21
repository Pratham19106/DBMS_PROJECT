const express = require('express');
const { registerController, loginController } = require('../Controller/auth');
const router = express.Router();

router.post("/register" , registerController)

router.post('/login' , loginController)

module.exports = router