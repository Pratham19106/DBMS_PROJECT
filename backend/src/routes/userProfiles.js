const express = require('express');
const { getAllUserProfiles, getUserProfile, addUserProfile, updateUserProfile } = require("../Controller/userProfile");
const authMiddleware = require('../middlewares/authMiddleware');
const validateUser = require('../middlewares/validateUser')
const router = express.Router();

router.get("/users/profiles",getAllUserProfiles) // for product6ion

router.get("/users/:id/profiles" ,authMiddleware , (req , res ,next) => validateUser(req , res , next, getUserProfile))
router.post("/users/:id/profiles" , addUserProfile)
router.put("/users/:id/profiles",authMiddleware ,(req , res ,next) => validateUser(req , res , next, updateUserProfile))


module.exports = router;