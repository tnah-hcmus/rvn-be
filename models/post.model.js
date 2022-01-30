module.exports = (sequelize, Sequelize) => {
  const Post = sequelize.define(
    "posts",
    {
      id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true,
      },
      ownerId: {
        type: Sequelize.STRING,
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
      url: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      lastUpdated: {
        type: Sequelize.STRING,
        allowNull: false,
      }
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
        {
          name: "indexed_by_raw",
          fields: ["rawPostId"],
        },
      ],
    }
  );

  return Post;
};
