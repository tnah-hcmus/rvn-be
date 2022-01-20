const config = require("config/auth.config");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const sendEmail = require("helper/send-email");
const { user: User, refreshToken: RefreshToken } = require("models/index");
const Role = require("helper/role");
const {
  fullDetails,
  getAccount,
} = require("controllers/user/user.service.js");
const { getGoogleAccountFromCode, urlGoogle, loginWithIdToken } = require("helper/google-utils");
const {
  getFacebookUserData,
  getFacebookUrl,
} = require("helper/facebook-utils");
const { Op } = require("sequelize");
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

function getThirdPartyUrlInfo(thirdParty) {
  if (thirdParty === "facebook") return getFacebookUrl();
  else if (thirdParty === "google") return urlGoogle();
};

async function loginWithThirdParty({ email, password, name, ipAddress }) {
  try {
    let account = await User.scope("withHash").findOne({ where: { email } });
    let refreshToken = null;
    let jwtToken = null;
    if (account) {
      jwtToken = generateJwtToken(account);
      refreshToken = generateRefreshToken(account, ipAddress);
      await refreshToken.save();
    } else {
      // create account object
      account = new User({ email, password, name, username: email });
      account.role = Role.User;
      account.verified = Date.now();
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
    const {email, password, name } = await loginWithIdToken(idToken);
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
    if (
      !account ||
      !(await bcrypt.compare(password, account.passwordHash))
    ) {
      throw "Email/username or password is incorrect";
    } else if( !account.isVerified) {
      throw "Account is not verified yet"
    }
    // authentication successful so generate jwt and refresh tokens
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
    const account = await User.scope("withHash").findOne({refreshToken: token});
    // revoke token and save
    refreshToken.revoked = Date.now();
    refreshToken.revokedByIp = ipAddress;
    account.token = null;
    await Promise.all([
      refreshToken.save(),
      account.save()
    ]);
  } catch (err) {
    throw err;
  }
}

async function register(params, origin) {
  try {
    // validate
    if (await User.findOne({ where: { email: params.email } })) {
      // send already registered error in email to prevent account enumeration
      sendAlreadyRegisteredEmail(params.email, origin);
      throw 'Email "' + params.email + '" is already registered';
    }
    if (await User.findOne({ where: { username: params.username } })) {
      throw 'Username "' + params.username + '" is already registered';
    }
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
    await sendVerificationEmail(account, origin);

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

async function forgotPassword({ email }, origin) {
  try {
    const account = await User.findOne({ where: { email } });

    // always return ok response to prevent email enumeration
    if (!account) return;

    // create reset token that expires after 24 hours
    account.resetToken = randomTokenString();
    account.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await account.save();

    // send email
    await sendPasswordResetEmail(account, origin);
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
  return jwt.sign({ sub: Date.now(), id: account.id }, config.secret, {
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

async function sendVerificationEmail(account, origin = 'http://174.138.28.27') {
  try {
    let message;
    if (origin) {
      const verifyUrl = `${origin}/auth/verify-email?token=${account.verificationToken}`;
      message = `<p>Please click the below link to verify your email address:</p>
                   <p><a href="${verifyUrl}">${verifyUrl}</a></p>`;
    } 
    message += `<p>If you are developer. Please use the below token to verify your email address with the <code>/account/verify-email</code> api route:</p>
                   <p><code>${account.verificationToken}</code></p>`;

    await sendEmail({
      to: account.email,
      subject: "Sign-up Verification API - Verify Email",
      html: `<h4>Verify Email</h4>
               <p>Thanks for registering!</p>
               ${message}`,
    });
  } catch (err) {
    throw err;
  }
}

async function sendAlreadyRegisteredEmail(email, origin = 'http://174.138.28.27') {
  try {
    let message;
    if (origin) {
      message = `<p>If you don't know your password please visit the <a href="${origin}/api/auth/forgot-password">forgot password</a> page.</p>`;
    } 
    message += `<p>If you are developer. If you don't know your password you can reset it via the <code>/api/auth/forgot-password</code> api route.</p>`;

    await sendEmail({
      to: email,
      subject: "Sign-up Verification API - Email Already Registered",
      html: `<h4>Email Already Registered</h4>
               <p>Your email <strong>${email}</strong> is already registered.</p>
               ${message}`,
    });
  } catch (err) {
    throw err;
  }
}

async function sendPasswordResetEmail(account, origin = 'http://174.138.28.27') {
  try {
    let message;
    if (origin) {
      const resetUrl = `${origin}/auth/reset-password?token=${account.resetToken}`;
      message = `<p>Please click the below link to reset your password, the link will be valid for 1 day:</p>
                   <p><a href="${resetUrl}">${resetUrl}</a></p>`;
    }
    message = `<p>If you are developer. Please use the below token to reset your password with the <code>/api/auth/reset-password</code> api route:</p>
                   <p><code>${account.resetToken}</code></p>`;

    await sendEmail({
      to: account.email,
      subject: "Sign-up Verification API - Reset Password",
      html: `<h4>Reset Password Email</h4>
               ${message}`,
    });
  } catch (err) {
    throw err;
  }
}
