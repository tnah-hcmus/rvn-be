const imageHelper = require("./image.service");
const Joi = require("joi");
const validateRequest = require("middleware/validate-request");
const Role = require("helper/role");
const { getSignedUrlForGetImage } = require("helper/aws-s3-utils");

module.exports = {
  getByUserId,
  getById,
  createSchema,
  create,
  updateSchema,
  update,
  delete: _delete,
};

function getByUserId(req, res, next) {
  // any user can see image except secure image
  if (!req.user.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  imageHelper.getByUserId(req.user.id).then(async (images) => {
    const urlList = await Promise.all(
      images.map(({ bucket, key }) => {
        if (bucket && key) return getSignedUrlForGetImage(key, bucket);
      })
    );
    res.send(urlList);
  });
}

function getById(req, res, next) {
  // any user can see image except secure image
  if (!req.user.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  imageHelper
    .getById(req.params.id, req.user.id)
    .then((image) => {
      if (image) {
        const { bucket, key } = image;
        getSignedUrlForGetImage(key, bucket).then((url) => {
          res.send(url);
        });
      } else res.sendStatus(404);
    })
    .catch(next);
}
function createSchema(req, res, next) {
  const schema = Joi.object({
    ownerId: Joi.number().integer().required(),
    bucket: Joi.string().required(),
    key: Joi.string().required(),
    isThumbnail: Joi.boolean(),
    secure: Joi.boolean(),
  });
  validateRequest(req, next, schema);
}

function create(req, res, next) {
  imageHelper
    .create(req.body)
    .then((image) => res.json(image))
    .catch(next);
}

function updateSchema(req, res, next) {
  const schemaRules = {};

  // only admins can update specified field
  if (req.user.role === Role.Admin) {
    //schemaRules.role = Joi.string().valid(Role.Admin, Role.User).empty('');
  }

  const schema = Joi.object(schemaRules);
  validateRequest(req, next, schema);
}

function update(req, res, next) {
  //admins can update any image, maybe moderator in future so this code still here although i except it through authorize() middleware
  if (req.user.role !== Role.Admin) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  imageHelper
    .update(req.params.id, req.body)
    .then((image) => res.json(image))
    .catch(next);
}

function _delete(req, res, next) {
  //admins can update any payment
  if (req.user.role !== Role.Admin || !req.user.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  imageHelper
    .delete(req.params.id, req.user.id)
    .then(() => res.json({ message: "Image deleted successfully" }))
    .catch(next);
}
