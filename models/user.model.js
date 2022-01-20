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
    indexes:[
      {
        unique: true,
        fields:['email']
      },
      {
        unique: true,
        fields:['username']
      }
    ]
  };
  const User = sequelize.define(
    "users",
    {
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
      pointBaseLevel: {
        type: Sequelize.INTEGER,
        defaultValue: 100
      },
      point: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      avatar: {
        type: Sequelize.STRING,
      },
      favouriteLocations: {
        type: Sequelize.STRING,
        get() {
          return this.getDataValue("favouriteLocations")?.split(";") || [];
        },
        set(val) {
          if (Array.isArray(val)) val = new Set(val);
          this.setDataValue("favouriteLocations", Array.from(val).join(";"));
        },
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
