const { trans: Trans } = require("models/index");
module.exports = {
  create,
  update,
  delete: _delete,
  getByTransId,
  getByUserId,
  deleteAllByPostId,
};

async function create(params) {
  try {
    const trans = new Trans(params);
    await trans.save();
    return trans;
  } catch (err) {
    throw err;
  }
}

async function update(id, userId, params) {
  try {
    const trans = await getByTransId(id, userId);
    Object.assign(trans, params);
    await trans.save();
  } catch (err) {
    throw err;
  }
}

async function _delete(id, userId) {
  try {
    const trans = await getByTransId(id, userId);
    await trans.destroy();
  } catch (err) {
    throw err;
  }
}

async function getByTransId(id, userId) {
  try {
    const trans = await Trans.findOne({
      where: { commentId: id, ownerId: userId },
    });
    if (!trans) throw "Trans not found";
    return trans;
  } catch (err) {
    throw err;
  }
}

function getByUserId(id) {
  return Trans.findAll({ where: { ownerId: id } })
  .then((result) => {
    const comments = result.map((row) => {
      const comment = row.get();
      delete comment.id;
      delete comment.ownerId;
      return comment;
    });
    return comments;
  });
}

async function deleteAllByPostId(id, userId) {
  try {
    return await Trans.destroy({ where: { postId: id, ownerId: userId } });
  } catch (err) {
    throw err;
  }
}
