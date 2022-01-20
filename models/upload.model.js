module.exports = (sequelize, Sequelize) => {
  const Upload = sequelize.define("uploads", {
    uploadId: {
      type: Sequelize.STRING,
      primaryKey: true,
    },
    fileName: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    imageId: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    thumbnailId: {
      type: Sequelize.STRING,
    },
  });
  return Upload;
};
