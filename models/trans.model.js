module.exports = (sequelize, Sequelize) => {
  const Translate = sequelize.define(
    "translates",
    {
      commentId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      ownerId: {
        type: Sequelize.STRING,
        allowNull: false,
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
          name: "index_by_indentity",
          fields: ["postId", "ownerId"],
        },
        {
          name: "index_by_ownerId",
          fields: ["ownerId"],
        },
        {
          name: "indexex_by_data_id",
          fields: ["commentId", "ownerId"],
        },
      ],
    }
  );

  return Translate;
};
