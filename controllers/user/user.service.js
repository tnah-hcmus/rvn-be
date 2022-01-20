const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const config = require("config/auth.config");
const { user: User, refreshToken: RefreshToken } = require("models/index");

module.exports = {
  getAll,
  getById,
  create,
  update,
  updatePoint,
  delete: _delete,
  fullDetails,
  basicDetails,
  updateFavouriteLocation,
  getAccount,
};
async function getAll() {
  try {
    const accounts = await User.findAll();
    return accounts.map((x) => basicDetails(x));
  } catch (err) {
    throw err;
  }
}

async function getById(id, isOwn) {
  try {
    const account = await getAccount(id);
    return isOwn ? fullDetails(account) : basicDetails(account);
  } catch (err) {
    throw err;
  }
}

async function create(params) {
  try {
    // validate
    if (await User.findOne({ where: { email: params.email } })) {
      throw 'Email "' + params.email + '" is already registered';
    }
    if (await User.findOne({ where: { username: params.username } })) {
      throw 'Username "' + params.username + '" is already registered';
    }

    const account = new User(params);
    account.verified = Date.now();

    // hash password
    account.passwordHash = await hash(params.password);
    account.rawPassword = params.password;

    // save account
    await account.save();

    const jwtToken = generateJwtToken(account);
    const refreshToken = generateRefreshToken(account, params.ipAddress);

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

async function update(id, params) {
  try {
    const account = await getAccount(id);

    // validate (if email was changed)
    if (
      params.email &&
      account.email !== params.email &&
      (await User.findOne({ where: { email: params.email } }))
    ) {
      throw 'Email "' + params.email + '" is already taken';
    }

    // hash password if it was entered
    if (params.password) {
      params.passwordHash = await hash(params.password);
    }

    // copy params to account and save
    Object.assign(account, params);
    await account.save();

    return fullDetails(account);
  } catch (err) {
    throw err;
  }
}

async function updateFavouriteLocation({ operation, locationId, userId }) {
  try {
    const account = await getAccount(userId);
    const preValue = new Set(account.favouriteLocations);
    switch (operation) {
      case "LIKE":
        account.favouriteLocations = preValue.add(locationId);
        break;
      case "UNLIKE":
        account.favouriteLocations = preValue.delete(locationId);
        break;
      case "RESET":
        account.favouriteLocations = new Set([]);
        break;
    }
    await account.save();
    return "Success update favourite location";
  } catch (err) {
    throw err;
  }
}

async function updatePoint(userId) {
  try {
    const account = await getAccount(userId);
    account.point += 5;
    await account.save();
  } catch (err) {
    throw err;
  }
}

async function _delete(id) {
  try {
    const account = await getAccount(id);
    await account.destroy();
  } catch (err) {
    throw err;
  }
}

function fullDetails(account) {
  try {
    const {
      id,
      username,
      email,
      token,
      isVerified,
      name,
      avatar,
      favouriteLocations,
      pointBaseLevel, 
      point
    } = account;
    return {
      id,
      username,
      email,
      token,
      isVerified,
      name,
      avatar,
      favouriteLocations,
      pointBaseLevel, 
      point
    };
  } catch (err) {
    throw err;
  }
}

function basicDetails(account) {
  try {
    const { id, username, name, avatar, pointBaseLevel, point } = account;
    return { id, username, name, avatar, pointBaseLevel, point };
  } catch (err) {
    throw err;
  }
}

async function getAccount(id) {
  try {
    const account = await User.findByPk(id);
    if (!account) throw "Account not found";
    return account;
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

function randomTokenString() {
  return crypto.randomBytes(40).toString("hex");
}

function generateJwtToken(account) {
  // create a jwt token containing the account id that expires in 15 minutes
  return jwt.sign({ sub: Date.now(), id: account.id }, config.secret, {
    expiresIn: "15m",
  });
}

function generateRefreshToken(account, ipAddress) {
  // create a refresh token that expires in 7 days
  return new RefreshToken({
    userId: account.id,
    token: randomTokenString(),
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdByIp: ipAddress,
  });
}
