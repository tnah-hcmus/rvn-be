const { upload: Upload } = require("models/index");
const imageHelper = require("../image/image.service");
const createUUID = require("helper/generate-uuid");
const { getSignedUrlForUploadImage } = require("helper/aws-s3-utils");

module.exports = {
  init,
  create,
  update,
  delete: _delete,
  getById,
};

async function init({ type, createThumbnail }) {
  try {
    const uploadId = createUUID();
    const imageId = createUUID();
    const data = { imageId, uploadId };
    if (createThumbnail) {
      const thumbnailId = createUUID();
      data.thumbnailId = thumbnailId;
      [data.thumbnailUrl, data.imageUrl] = await Promise.all([
        getSignedUrlForUploadImage(data.thumbnailId, type),
        getSignedUrlForUploadImage(data.imageId, type),
      ]);
    } else data.imageUrl = await getSignedUrlForUploadImage(data.imageId, type);
    return data;
  } catch (err) {
    throw err;
  }
}

async function create(params, ownerId) {
  try {
    const upload = new Upload(params);
    let waitingList = [];
    if (params.imageId) {
      waitingList.push(
        imageHelper.create({ ownerId, key: params.imageId, bucket: process.env.BUCKET })
      );
    }
    if (params.thumbnailId) {
      waitingList.push(
        imageHelper.create({ ownerId, key: params.thumbnailId, bucket: process.env.BUCKET, isThumbnail: true })
      );
    }
    await waitingList;
    // save upload
    await upload.save();
    return upload;
  } catch (err) {
    throw err;
  }
}

async function update(id, params) {
  try {
    const upload = await getById(id);

    // copy params to upload and save
    Object.assign(upload, params);
    await upload.save();
  } catch (err) {
    throw err;
  }
}

async function _delete(id) {
  try {
    const upload = await getById(id);
    await upload.destroy();
  } catch (err) {
    throw err;
  }
}

async function getById(id) {
  try {
    const upload = await Upload.findByPk(id);
    if (!upload) throw "Upload not found";
    return upload;
  } catch (err) {
    throw err;
  }
}
