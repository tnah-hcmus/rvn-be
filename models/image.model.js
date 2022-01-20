module.exports = (sequelize, Sequelize) => {
  const Image = sequelize.define("images", {
    ownerId: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    isThumbnail: {
      type: Sequelize.BOOLEAN,
      default: false
    },
    secure: {
      type: Sequelize.BOOLEAN,
      default: false,
    },
    bucket: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    key: {
      type: Sequelize.STRING,
      primaryKey: true,
      allowNull: false,
    },
  });
  return Image;
};
