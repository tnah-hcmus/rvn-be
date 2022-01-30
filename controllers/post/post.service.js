const { post: Post } = require("models/index");
module.exports = {
  getByUserId,
  create,
  update,
  delete: _delete,
  getByPostId,
  getById,
};

function getByUserId(id) {
  return Post.findAll({ where: { ownerId: id } }).then((result) => {
    const posts = result.map((row) => {
      const post = row.get();
      delete post.id;
      delete post.ownerId;
      return post;
    });
    return posts;
  });
}

async function create(params) {
  try {
    let post = await getByIdentity(params.ownerId, params.rawPostId);
    if (post) throw "Already have post on this location";
    else post = new Post(params);

    await post.save();
    return post;
  } catch (err) {
    throw err;
  }
}

async function update(userId, id, params) {
  try {
    const post = await getByIdentity(userId, id);
    if (post) {
      // copy params to account and save
      Object.assign(post, params);
      await post.save();
    } else throw { name: "UnauthorizedError" };
  } catch (err) {
    throw err;
  }
}

async function _delete(id, userId) {
  try {
    const post = await getByIdentity(userId, id);
    await post.destroy();
  } catch (err) {
    throw err;
  }
}

async function getByIdentity(ownerId, rawPostId) {
  try {
    const post = await Post.findOne({ where: { rawPostId, ownerId } });
    return post;
  } catch (err) {
    throw err;
  }
}

async function getById(id) {
  try {
    const post = await Post.findByPk(id);
    if (!post) throw "Post not found";
    return post;
  } catch (err) {
    throw err;
  }
}
async function getByPostId(id) {
  try {
    const post = await Post.findOne({ rawPostId: id });
    if (!post) throw "Post not found";
    return post;
  } catch (err) {
    throw err;
  }
}
