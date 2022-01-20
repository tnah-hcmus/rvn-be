module.exports = (sequelize, Sequelize) => {
  const RefreshToken = sequelize.define(
    "refreshTokens",
    {
      token: {
        type: Sequelize.STRING,
      },
      expires: {
        type: Sequelize.DATE,
      },
      created: {
        type: Sequelize.DATE,
      },
      createdByIp: {
        type: Sequelize.STRING,
      },
      revoked: {
        type: Sequelize.DATE,
      },
      revokedByIp: {
        type: Sequelize.STRING,
      },
      revokedByToken: {
        type: Sequelize.STRING,
      },
      isExpired: {
        type: Sequelize.VIRTUAL,
        get() {
          return Date.now() >= this.expires;
        },
      },
      isActive: {
        type: Sequelize.VIRTUAL,
        get() {
          return !this.revoked && !this.isExpired;
        },
      },
    },
    { timestamps: false }
  );

  return RefreshToken;
};
