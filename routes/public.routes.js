const express = require("express");
const router = express.Router();
const authController = require("controllers/auth/auth.controller");
const path = require('path')
router.get("/auth/verify-email",
    authController.verifyEmailSchema,
    authController.verifyEmail
);
router.get("/verified", (req, res, next) => {
    res.sendFile(path.join(__dirname,'../public/success.html'));
});
router.get("/auth/reset-password", (req, res, next) => {
    res.sendFile(path.join(__dirname,'../public/reset.html'));
});
router.get("/done-reset", (req, res, next) => {
    res.sendFile(path.join(__dirname,'../public/done-reset.html'));
});

module.exports = router;
