module.exports = (sequelize, Sequelize) => {
  const options = {
    defaultScope: {
      // exclude password hash by default
      attributes: {
        exclude: [
          "passwordHash",
          "token",
          "verificationToken",
          "resetToken",
          "resetTokenExpires",
          "passwordReset",
        ],
      },
    },
    scopes: {
      // include hash with this scope
      withHash: { attributes: {} },
    },
    indexes: [
      {
        unique: true,
        fields: ["email"],
      },
      {
        unique: true,
        fields: ["username"],
      },
    ],
  };
  const User = sequelize.define(
    "users",
    {
      id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      email: {
        type: Sequelize.STRING,
        // unique: true,
      },
      username: {
        type: Sequelize.STRING,
        // unique: true,
      },
      passwordHash: {
        type: Sequelize.STRING,
      },
      name: {
        type: Sequelize.STRING,
      },
      aliasName: {
        type: Sequelize.STRING,
      },
      pointBaseLevel: {
        type: Sequelize.INTEGER,
        defaultValue: 100,
      },
      point: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      avatar: {
        type: Sequelize.STRING,
      },
      token: {
        type: Sequelize.STRING,
      },
      role: {
        type: Sequelize.STRING,
      },
      verificationToken: {
        type: Sequelize.STRING,
      },
      verified: {
        type: Sequelize.DATE,
      },
      resetToken: {
        type: Sequelize.STRING,
      },
      resetTokenExpires: {
        type: Sequelize.DATE,
      },
      passwordReset: {
        type: Sequelize.DATE,
      },
      isVerified: {
        type: Sequelize.VIRTUAL,
        get() {
          return !!(this.verified || this.passwordReset);
        },
      },
    },
    options
  );

  return User;
};
