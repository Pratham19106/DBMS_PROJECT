const express = require("express")
const router = express.Router();

router.get('/users/:userId/purchase', (req, res) => {
    return res.status(501).json({
        msg: "Purchase optimization endpoint is not implemented yet"
    })
});

module.exports = router;

