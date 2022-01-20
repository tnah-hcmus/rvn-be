const { image: Image } = require("models/index");
module.exports = {
  getByUserId,
  create,
  update,
  delete: _delete,
  getById,
};

async function create(params) {
  try {
    const image = new Image(params);
    // save payment
    await image.save();
    return image;
  } catch (err) {
    throw err;
  }
}

async function update(id, params) {
  try {
    const image = await getById(id);

    // copy params to account and save
    Object.assign(image, params);
    await image.save();
  } catch (err) {
    throw err;
  }
}

async function _delete(id, userId, isAdmin) {
  try {
    const image = await getById(id);
    if (image.ownerId !== userId || isAdmin)
      throw "You don't have permission to delete this image";
    await image.destroy();
  } catch (err) {
    throw err;
  }
}

async function getById(id, userId) {
  try {
    const image = await Image.findByPk(id);
    if (!image) throw "Image not found";
    else if (image.secure) {
      if (image.ownerId !== userId)
        throw "You don't have permission to view this image";
    }
    return image;
  } catch (err) {
    throw err;
  }
}

async function getByUserId(id) {
  try {
    return await Image.findAll({ where: { ownerId: id, isThumbnail: false } });
  } catch (err) {
    throw err;
  }
}
