const express = require("express");
const router = express.Router();
const authorize = require("middleware/authorize");
const authController = require("controllers/auth/auth.controller");

router.post(
  "/local",
  authController.authenticateSchema,
  authController.authenticate
);
router
  .get("/oauth/google", authController.getOAuthInfo)
  .post(
    "/oauth/google",
    authController.loginWithThirdPartySchema,
    authController.loginWithThirdParty
  );
router
  .get("/oauth/facebook", authController.getOAuthInfo)
  .post(
    "/oauth/facebook",
    authController.loginWithThirdPartySchema,
    authController.loginWithThirdParty
  );
router.post("/refresh-token", authController.refreshToken);
router.post(
  "/change-password",
  authorize(),
  authController.changePasswordSchema,
  authController.changePassword
);
router.post(
  "/revoke-token",
  authorize(),
  authController.revokeTokenSchema,
  authController.revokeToken
);
router.post(
  "/register",
  authController.registerSchema,
  authController.register
);
router.post(
    "/verify-email",
    authController.verifyEmailSchema,
    authController.verifyEmail
  );
router.post(
  "/forgot-password",
  authController.forgotPasswordSchema,
  authController.forgotPassword
);
router.post(
  "/reset-password",
  authController.resetPasswordSchema,
  authController.resetPassword
);

module.exports = router;
