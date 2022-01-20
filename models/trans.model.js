module.exports = (sequelize, Sequelize) => {
  const Translate = sequelize.define(
    "translates",
    {
      commentId: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      postId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      content: {
        type: Sequelize.STRING,
      },
      rootCommentId: {
        type: Sequelize.STRING,
      },
    },
    {
      timestamps: false,
      indexes: [
        {
          name: "index_by_postId",
          fields: ["postId"],
        },
      ],
    }
  );

  return Translate;
};
