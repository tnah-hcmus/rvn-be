module.exports = (sequelize, Sequelize) => {
  const Post = sequelize.define(
    "posts",
    {
      ownerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      rawPostId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      subreddit: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      mediaLink: {
        type: Sequelize.STRING,
      },
      isPosted: {
        type: Sequelize.BOOLEAN,
        default: false,
      },
    },
    {
      timestamps: false,
      indexes: [
        {
          name: "indexed_by_owner",
          fields: ["ownerId"],
        },
        {
          name: "indexed_by_cons",
          fields: ["ownerId", "rawPostId"],
        },
      ],
    }
  );

  return Post;
};
