const express = require('express');
const { getUser, getAllUsers, addNewUser, deleteUser, updateUser } = require('../Controller/users');
const authMiddleware = require('../middlewares/authMiddleware');
const validateUser = require('../middlewares/validateUser');
const router = express.Router();
router.use(express.json());
// router.get('/users', getUser
// })
router.get('/users/:id',authMiddleware ,  (req , res ,next) => validateUser(req , res , next, getUser))
router.get('/users',  getAllUsers)
router.post('/users', addNewUser)
router.delete('/users/:id', authMiddleware ,  (req , res ,next) => validateUser(req , res , next, deleteUser))
router.put('/users/:id', authMiddleware , (req , res ,next) => validateUser(req , res , next, updateUser))

module.exports = router;