const express = require('express');
const { getUser, getAllUsers, addNewUser, deleteUser, updateUser } = require('../Controller/users');

const router = express.Router();
router.use(express.json());

router.get('/users/:id', getUser);
router.get('/users', getAllUsers);
router.post('/users', addNewUser);
router.delete('/users/:id', deleteUser);
router.put('/users/:id', updateUser);

module.exports = router;