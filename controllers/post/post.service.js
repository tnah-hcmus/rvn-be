const { post: Post } = require("models/index");
module.exports = {
  getByUserId,
  create,
  update,
  delete: _delete,
  getByPostId,
};

async function getByUserId(id) {
  try {
    return await Post.findAll({ where: { ownerId: id } });
  } catch (err) {
    throw err;
  }
}

async function create(params) {
  try {
    let post = await getByIdentity(params.ownerId, params.rawPostId);
    if(post) throw 'Already have post on this location';
    else post = new Post(params);
    
    await post.save();
    return post;
  } catch (err) {
    throw err;
  }
}

async function update(userId, id, params, isAdmin) {
  try {
    const post = await getByPostId(id);
    if (post.ownerId === userId || isAdmin) {
      // copy params to account and save
      Object.assign(post, params);
      await post.save();
    } else throw { name: "UnauthorizedError" };
  } catch (err) {
    throw err;
  }
}

async function _delete(id) {
  try {
    const post = await getByPostId(id);
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

async function getByPostId(id) {
  try {
    const post = await Post.findByPk(id);
    if (!post) throw "Post not found";
    return post;
  } catch (err) {
    throw err;
  }
}
