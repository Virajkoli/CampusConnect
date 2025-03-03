const express = require("express");

const { registerUser, loginUser } = require("../controllers/authController");

const router = express.Router();

//this register is for a new user
router.post("/register", registerUser);

// this login is for existing user
router.post("/login", loginUser);

module.exports = router;
