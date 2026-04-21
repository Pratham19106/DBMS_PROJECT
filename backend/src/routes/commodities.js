const express = require('express');
const { getCommodity, getAllCommodies, addNewCommodity, updateCommodity, deleteCommodity } = require('../Controller/commodities');
const router = express.Router();

router.use(express.json());

router.get('/users/:userId/commodities/:id', getCommodity)
router.get('/users/:userId/commodities', getAllCommodies)
router.post('/users/:userId/commodities', addNewCommodity)
router.put('/users/:userId/commodities/:id', updateCommodity)
router.delete('/users/:userId/commodities/:id', deleteCommodity)

module.exports = router;