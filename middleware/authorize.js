const jwt = require("express-jwt");
const { secret } = require("config/auth.config");
const db = require("models/index");

module.exports = authorize;

function authorize(roles = []) {
  // roles param can be a single role string (e.g. Role.User or 'User')
  // or an array of roles (e.g. [Role.Admin, Role.User] or ['Admin', 'User'])
  if (typeof roles === "string") {
    roles = [roles];
  }

  return [
    // authenticate JWT token and attach user to request object (req.user)
    jwt({ secret, algorithms: ["HS256"] }),

    // authorize based on user role
    async (req, res, next) => {
      try {
        const account = await db.user.findByPk(req.user.id);

        if (!account || (roles.length && !roles.includes(account.role))) {
          // account no longer exists or role not authorized
          return res.status(401).json({ message: "Unauthorized" });
        }

        // authentication and authorization successful
        req.user.role = account.role;
        req.user.username = account.username;
        const refreshTokens = await account.getRefreshTokens();
        req.user.ownsToken = (token) =>
          !!refreshTokens.find((x) => x.token === token);
      } catch (e) {
        console.log(e);
        req.err = e;
      }
      next();
    },
  ];
}
