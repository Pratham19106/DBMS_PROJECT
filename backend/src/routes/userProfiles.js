const express = require('express');
const { getAllUserProfiles, getUserProfile, addUserProfile, updateUserProfile } = require("../Controller/userProfile");

const router = express.Router();

router.get("/users/profiles", getAllUserProfiles);
router.get("/users/:id/profiles", getUserProfile);
router.post("/users/:id/profiles", addUserProfile);
router.put("/users/:id/profiles", updateUserProfile);

module.exports = router;