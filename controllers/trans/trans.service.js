const { trans: Trans } = require("models/index");
module.exports = {
  create,
  update,
  delete: _delete,
  getByTransId,
};

async function create(params) {
  try {
    const trans = new Trans(params);
    // save payment
    await trans.save();
    return trans;
  } catch (err) {
    throw err;
  }
}

async function update(id, params) {
  try {
    const trans = await getByTransId(id);
    // copy params to account and save
    Object.assign(trans, params);
    await trans.save();
  } catch (err) {
    throw err;
  }
}

async function _delete(id) {
  try {
    const trans = await getByTransId(id);
    await trans.destroy();
  } catch (err) {
    throw err;
  }
}

async function getByTransId(id) {
  try {
    const trans = await Trans.findByPk(id);
    if (!trans) throw "Trans not found";
    return trans;
  } catch (err) {
    throw err;
  }
}
