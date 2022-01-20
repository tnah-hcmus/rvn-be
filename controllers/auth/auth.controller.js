const authHelper = require("./auth.service");
const Joi = require("joi");
const validateRequest = require("middleware/validate-request");
const Role = require("helper/role");
const { captchaKey } = require("config/auth.config");
const fetch = require("node-fetch");
module.exports = {
  authenticate,
  authenticateSchema,
  refreshToken,
  revokeTokenSchema,
  revokeToken,
  registerSchema,
  register,
  getOAuthInfo,
  loginWithThirdPartySchema,
  loginWithThirdParty,
  verifyEmailSchema,
  verifyEmail,
  forgotPasswordSchema,
  forgotPassword,
  resetPasswordSchema,
  verifyCaptcha,
  resetPassword,
  changePasswordSchema,
  changePassword,
};

function authenticateSchema(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function authenticate(req, res, next) {
  const { email, password } = req.body;
  const emailOrUsername = email;
  const ipAddress = req.ip;
  authHelper
    .authenticate({ emailOrUsername, password, ipAddress })
    .then((account) => {
      setTokenCookie(res, account.refreshToken);
      res.json(account);
    })
    .catch(next);
}

function loginWithThirdPartySchema(req, res, next) {
  const schema = Joi.object({
    code: Joi.string(),
    idToken: Joi.string()
  });
  validateRequest(req, next, schema);
}

function loginWithThirdParty(req, res, next) {
  const { code, idToken } = req.body;
  const ipAddress = req.ip;
  let promisedAccount = null;
  console.log("Here")
  if (req.url.includes("google"))
    promisedAccount = authHelper.loginWithGoogle({ idToken, ipAddress });
  else if (req.url.includes("facebook"))
    promisedAccount = authHelper.loginWithFacebook({ code, ipAddress });
  if (promisedAccount) {
    promisedAccount
      .then((account) => {
        setTokenCookie(res, account.refreshToken);
        res.json(account);
      })
      .catch(next);
  } else res.status(400).json({ message: "Error occured" });
}

function getOAuthInfo(req, res, next) {
  let url = null;
  if (req.url.includes("google"))
    url = authHelper.getThirdPartyUrlInfo("google");
  else if (req.url.includes("facebook"))
    url = authHelper.getThirdPartyUrlInfo("facebook");
  res.send(url);
}

function refreshToken(req, res, next) {
  const token = req.body.refreshToken;
  const ipAddress = req.ip;
  authHelper
    .refreshToken({ token, ipAddress })
    .then((account) => {
      setTokenCookie(res, account.refreshToken);
      res.json(account);
    })
    .catch(next);
}

function revokeTokenSchema(req, res, next) {
  const schema = Joi.object({
    token: Joi.string().empty(/.*/),
  });
  validateRequest(req, next, schema);
}

function revokeToken(req, res, next) {
  // accept token from request body or cookie
  const token = req.body.token || req.cookies.refreshToken;
  const ipAddress = req.ip;

  if (!token) return res.status(400).json({ message: "Token is required" });
  // users can revoke their own tokens and admins can revoke any tokens
  if (!req.user.ownsToken(token) && req.user.role !== Role.Admin) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  authHelper
    .revokeToken({ token, ipAddress })
    .then(() => res.json({ message: "Token revoked" }))
    .catch(next);
}

function registerSchema(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
  });
  validateRequest(req, next, schema);
}

function register(req, res, next) {
  authHelper
    .register(req.body, req.get("origin"))
    .then(() =>
      res.json({
        message:
          "Registration successful, please check your email for verification instructions",
      })
    )
    .catch(next);
}

function changePasswordSchema(req, res, next) {
  const schema = Joi.object({
    oldPassword: Joi.string().min(6).required(),
    newPassword: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref("newPassword")).required(),
  });
  validateRequest(req, next, schema);
}

function changePassword(req, res, next) {
  if (!req.user.id) return res.status(401).json({ message: "Unauthorized" });
  req.body.id = req.user.id;
  authHelper
    .changePassword(req.body)
    .then((data) => res.json(data))
    .catch(next);
}

function verifyCaptcha(req, res, next) {
  const VERIFY_URL = `https://www.google.com/recaptcha/api/siteverify?secret=${captchaKey}&response=${req.body["g-recaptcha-response"]}`;
  return fetch(VERIFY_URL, { method: "POST" })
    .then((res) => res.json())
    .then((res) => {
      if (res.success || res.score > 0.8) next();
      else return "Your captcha didn't success";
    })
    .catch((e) => {
      console.log(e);
    });
}

function verifyEmailSchema(req, res, next) {
  const schema = Joi.object({
    token: Joi.string(),
  });
  validateRequest(req, next, schema);
}

function verifyEmail(req, res, next) {
  const token = req.query.token || req.body.token;
  if(!token) res.status(400).send('Invalid params');
  authHelper
    .verifyEmail({token})
    .then(() => {
      if(req.method === "POST") res.json({ message: "Verification successful, you can login now" })
      else res.redirect('/verified');
    })
    .catch(next);
}

function forgotPasswordSchema(req, res, next) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
  });
  validateRequest(req, next, schema);
}

function forgotPassword(req, res, next) {
  authHelper
    .forgotPassword(req.body, req.get("origin"))
    .then(() =>
      res.json({
        message: "Please check your email for password reset instructions",
      })
    )
    .catch(next);
}

function resetPasswordSchema(req, res, next) {
  const schema = Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
  });
  validateRequest(req, next, schema);
}

function resetPassword(req, res, next) {
  authHelper
    .resetPassword(req.body)
    .then(() =>
      res.json({ message: "Password reset successful, you can login now" })
    )
    .catch(next);
}

// helper functions

function setTokenCookie(res, token) {
  // create cookie with refresh token that expires in 33 days
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000),
  };
  res.cookie("refreshToken", token, cookieOptions);
}
