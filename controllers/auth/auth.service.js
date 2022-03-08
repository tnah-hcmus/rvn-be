const config = require("config/auth.config");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { promisify } = require("util");
const fs = require("fs");
const readFile = promisify(fs.readFile);
const sendEmail = require("helper/send-email");
const handlebars = require("handlebars");
const { user: User, refreshToken: RefreshToken } = require("models/index");
const Role = require("helper/role");
const createUUID = require("helper/generate-uuid");
const { fullDetails, getAccount } = require("controllers/user/user.service.js");
const {
  getGoogleAccountFromCode,
  urlGoogle,
  loginWithIdToken,
} = require("helper/google-utils");
const {
  getFacebookUserData,
  getFacebookUrl,
} = require("helper/facebook-utils");
const { Op } = require("sequelize");
const path = require("path");
module.exports = {
  authenticate,
  getThirdPartyUrlInfo,
  loginWithGoogle,
  loginWithFacebook,
  refreshToken,
  revokeToken,
  register,
  verifyEmail,
  forgotPassword,
  validateResetToken,
  resetPassword,
  changePassword,
};

const origin = "https://api.rvninc.net";

function getThirdPartyUrlInfo(thirdParty) {
  if (thirdParty === "facebook") return getFacebookUrl();
  else if (thirdParty === "google") return urlGoogle();
}

async function loginWithThirdParty({ email, password, name, ipAddress }) {
  try {
    let account = await User.scope("withHash").findOne({ where: { email } });
    let refreshToken = null;
    let jwtToken = null;
    if (account) {
      account.token = randomTokenString();
      await account.save();
      jwtToken = generateJwtToken(account);
      refreshToken = generateRefreshToken(account, ipAddress);
      await refreshToken.save();
    } else {
      // create account object
      account = new User({
        id: createUUID(),
        email,
        password,
        name,
        username: email,
      });
      account.role = Role.User;
      account.verified = Date.now();
      account.token = randomTokenString();
      account.passwordHash = await hash(password);
      await account.save();
      jwtToken = generateJwtToken(account);
      refreshToken = generateRefreshToken(account, ipAddress);
      await refreshToken.save();
    }
    return {
      ...fullDetails(account),
      jwtToken,
      refreshToken: refreshToken.token,
    };
  } catch (error) {
    throw error;
  }
}

async function loginWithGoogle({ idToken, ipAddress }) {
  try {
    // const { email, password, name } = await getGoogleAccountFromCode(code);
    const { email, password, name } = await loginWithIdToken(idToken);
    return await loginWithThirdParty({ email, password, name, ipAddress });
  } catch (err) {
    throw err;
  }
}

async function loginWithFacebook({ code, ipAddress }) {
  try {
    const { email, password, name } = await getFacebookUserData(code);
    return await loginWithThirdParty({ email, password, name, ipAddress });
  } catch (err) {
    throw err;
  }
}

async function authenticate({ emailOrUsername, password, ipAddress }) {
  try {
    let account = await User.scope("withHash").findOne({
      where: { email: emailOrUsername },
    });
    if (!account)
      account = await User.scope("withHash").findOne({
        where: { username: emailOrUsername },
      });
    if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
      throw "Email/username or password is incorrect";
    } else if (!account.isVerified) {
      throw "Account is not verified yet";
    }
    // authentication successful so generate jwt and refresh tokens
    account.token = randomTokenString();
    await account.save();
    const jwtToken = generateJwtToken(account);
    const refreshToken = generateRefreshToken(account, ipAddress);

    // save refresh token
    await refreshToken.save();

    // return basic details and tokens
    return {
      ...fullDetails(account),
      jwtToken,
      refreshToken: refreshToken.token,
    };
  } catch (err) {
    throw err;
  }
}

async function refreshToken({ token, ipAddress }) {
  try {
    const refreshToken = await getRefreshToken(token);
    const account = await getAccount(refreshToken.userId);

    // replace old refresh token with a new one and save
    const newRefreshToken = generateRefreshToken(account, ipAddress);
    refreshToken.revoked = Date.now();
    refreshToken.revokedByIp = ipAddress;
    refreshToken.replacedByToken = newRefreshToken.token;
    account.token = randomTokenString();
    await account.save();
    await refreshToken.save();
    await newRefreshToken.save();

    // generate new jwt
    const jwtToken = generateJwtToken(account);

    // return basic details and tokens
    return {
      ...fullDetails(account),
      jwtToken,
      refreshToken: newRefreshToken.token,
    };
  } catch (err) {
    throw err;
  }
}

async function changePassword({ oldPassword, newPassword, id }) {
  try {
    const account = await User.scope("withHash").findByPk(id);
    if (await bcrypt.compare(oldPassword, account.passwordHash)) {
      account.rawPassword = newPassword;
      account.passwordHash = await hash(newPassword);
      await account.save();
      return fullDetails(account);
    } else throw "Old password didn't match";
  } catch (err) {
    throw err;
  }
}

async function revokeToken({ token, ipAddress }) {
  try {
    const refreshToken = await getRefreshToken(token);
    const account = await getAccount(refreshToken.userId);
    // revoke token and save
    refreshToken.revoked = Date.now();
    refreshToken.revokedByIp = ipAddress;
    account.token = null;
    await Promise.all([refreshToken.save(), account.save()]);
  } catch (err) {
    throw err;
  }
}

async function register(params) {
  try {
    // validate
    const preAccount = await User.findOne({ where: { email: params.email } }) || await User.findOne({ where: { username: params.username } });
    if (preAccount) {
      // send already registered error in email to prevent account enumeration
      sendAlreadyRegisteredEmail(preAccount);
      throw 'Email/username is already registered';
    }
    params.id = createUUID();
    // create account object
    const account = new User(params);

    // first registered account is an admin
    const isFirstAccount = (await User.count()) === 0;
    account.role = isFirstAccount ? Role.Admin : Role.User;
    account.verificationToken = randomTokenString();

    // hash password
    account.passwordHash = await hash(params.password);
    account.rawPassword = params.password;

    //ignore mail
    //account.verified = Date.now();

    // save account
    await account.save();
    // send email
    await sendVerificationEmail(account);

    return account;
  } catch (err) {
    throw err;
  }
}

async function verifyEmail({ token }) {
  try {
    const account = await User.findOne({ where: { verificationToken: token } });

    if (!account) throw "Verification failed";

    account.verified = Date.now();
    account.verificationToken = null;
    await account.save();
  } catch (err) {
    throw err;
  }
}

async function forgotPassword({ credentital }) {
  try {
    const account = await User.findOne({ where: { email: credentital } }) || await User.findOne({ where: { username: credentital } });

    // always return ok response to prevent email enumeration
    if (!account) return;

    // create reset token that expires after 24 hours
    account.resetToken = randomTokenString();
    account.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await account.save();

    // send email
    await sendPasswordResetEmail(account);
  } catch (err) {
    throw err;
  }
}

async function validateResetToken({ token }) {
  try {
    const account = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpires: { [Op.gt]: Date.now() },
      },
    });

    if (!account) throw "Invalid token";

    return account;
  } catch (err) {
    throw err;
  }
}

async function resetPassword({ token, password }) {
  try {
    const account = await validateResetToken({ token });

    // update password and remove reset token
    account.passwordHash = await hash(password);
    account.rawPassword = password;
    account.passwordReset = Date.now();
    account.resetToken = null;
    await account.save();
  } catch (err) {
    throw err;
  }
}

// helper functions

async function getRefreshToken(token) {
  try {
    const refreshToken = await RefreshToken.findOne({ where: { token } });
    if (!refreshToken || !refreshToken.isActive) throw "Invalid token";
    return refreshToken;
  } catch (err) {
    throw err;
  }
}

async function hash(password) {
  try {
    return await bcrypt.hash(password, 10);
  } catch (err) {
    throw err;
  }
}

function generateJwtToken(account) {
  // create a jwt token containing the account id that expires in 7 days
  return jwt.sign({ sub: Date.now(), token: account.token }, config.secret, {
    expiresIn: "7d",
  });
}

function generateRefreshToken(account, ipAddress) {
  // create a refresh token that expires in 30 days
  return new RefreshToken({
    userId: account.id,
    token: randomTokenString(),
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    createdByIp: ipAddress,
  });
}

function randomTokenString() {
  return crypto.randomBytes(40).toString("hex");
}

async function sendVerificationEmail(account) {
  try {
    const html = await readFile("template/verify.html", "utf8");
    const template = handlebars.compile(html);
    const url = `${origin}/auth/verify-email?token=${account.verificationToken}`;
    const data = {
      url,
    };
    const htmlToSend = template(data);
    await sendEmail({
      to: account.email,
      subject: "Sign-up Verification RVN Editor - Verify Email",
      html: htmlToSend,
    });
  } catch (err) {
    throw err;
  }
}

async function sendAlreadyRegisteredEmail(account) {
  try {
    const html = await readFile(!account.isVerified ? "template/already-not-verify.html" : "template/already-verify.html", "utf8");
    const template = handlebars.compile(html);
    const url = !account.isVerified ? `${origin}/auth/verify-email?token=${account.verificationToken}` : "https://rvninc.net";
    const data = {
      url,
    };
    const htmlToSend = template(data);

    await sendEmail({
      to: email,
      subject: "Sign-up Verification API - Email Already Registered",
      html: htmlToSend,
    });
  } catch (err) {
    throw err;
  }
}

async function sendPasswordResetEmail(account) {
  try {
    const html = await readFile("template/forgot-password.html", "utf8");
    const template = handlebars.compile(html);
    const url = `${origin}/auth/reset-password?token=${account.resetToken}`;
    const data = {
      url,
    };
    const htmlToSend = template(data);

    await sendEmail({
      to: account.email,
      subject: "Sign-up Verification API - Reset Password",
      html: htmlToSend,
    });
  } catch (err) {
    throw err;
  }
}
