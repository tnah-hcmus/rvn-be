const userHelper = require("./user.service");
const uploadHelper = require("../upload/upload.service");
const { getSignedUrlForGetImage } = require("helper/aws-s3-utils");
const Joi = require("joi");
const validateRequest = require("middleware/validate-request");
const Role = require("helper/role");
const createUUID = require("helper/generate-uuid");

module.exports = {
  getAll,
  getById,
  createSchema,
  create,
  updateSchema,
  update,
  updateAvatarSchema,
  updateAvatar,
  editFavouriteLocationSchema,
  editFavouriteLocation,
  delete: _delete,
};

function getAll(req, res, next) {
  userHelper
    .getAll()
    .then((accounts) => res.json(accounts))
    .catch(next);
}

function getById(req, res, next) {
  // users can get their own account and admins can get any account
  let id = null;
  let isOwn = true;
  if (!req.user.id) return res.status(401).json({ message: "Unauthorized" });
  if (req.params.id) {
    if (Number(req.params.id) !== req.user.id) {
      isOwn = false;
      id = req.params.id;
    } else id = req.user.id;
  } else id = req.user.id;
  userHelper
    .getById(id, isOwn)
    .then((account) => (account ? res.json(account) : res.sendStatus(404)))
    .catch(next);
}

function createSchema(req, res, next) {
  const schema = Joi.object({
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
    role: Joi.string().valid(Role.Admin, Role.User).required(),
    pointBaseLevel: Joi.number(),
    point: Joi.number(),
    avatar: Joi.string(),
    favouriteLocations: Joi.array(),
  });
  validateRequest(req, next, schema);
}

function create(req, res, next) {
  req.body.ipAddress = req.ip;
  userHelper
    .create(req.body)
    .then((account) => res.json(account))
    .catch(next);
}

function updateSchema(req, res, next) {
  const schemaRules = {
    username: Joi.string().empty(/.*/),
    email: Joi.string().email().empty(/.*/),
    password: Joi.string().min(6).empty(/.*/),
    confirmPassword: Joi.string().valid(Joi.ref("password")).empty(/.*/),
    name: Joi.string(),
    pointBaseLevel: Joi.number(),
    point: Joi.number(),
    avatar: Joi.string(),
    favouriteLocations: Joi.array(),
  };

  // only admins can update role
  if (req.user.role === Role.Admin) {
    schemaRules.role = Joi.string().valid(Role.Admin, Role.User).empty(/.*/);
  } else schemaRules.role = Joi.string().valid(Role.Admin, Role.User);

  const schema = Joi.object(schemaRules).with("password", "confirmPassword");
  validateRequest(req, next, schema);
}

function update(req, res, next) {
  // users can update their own account and admins can update any account
  let id = null;
  if (req.params.id) {
    if (Number(req.params.id) !== req.user.id && req.user.role !== Role.Admin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    id = req.params.id;
  } else id = req.user.id;
  userHelper
    .update(id, req.body)
    .then((account) => res.json(account))
    .catch(next);
}

function updateAvatarSchema(req, res, next) {
  const schema = Joi.object({
    fileName: Joi.string().required(),
    imageId: Joi.string().required(),
    thumbnailId: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

async function updateAvatar(req, res, next) {
  if (!req.user.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    req.body.uploadId = createUUID();
    const upload = await uploadHelper.create(req.body, req.user.id);
    let account = await userHelper.update(req.user.id, { avatar: req.body.uploadId });
    const urls = await Promise.all([
      getSignedUrlForGetImage(upload.imageId),
      getSignedUrlForGetImage(upload.thumbnailId),
    ]);
    [account.avatarUrl, account.thumbnailUrl] = urls;
    return res.json(account);
  } catch (err) {
    next(err);
  }
}

function editFavouriteLocationSchema(req, res, next) {
  const schema = Joi.object({
    operation: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

function editFavouriteLocation(req, res, next) {
  if(req.body.operation !== 'RESET' && (!req.body.locationId || typeof req.body.locationId !== 'number')) {
    return res.status(400).send('Missing param locationId');
  }
  userHelper
    .updateFavouriteLocation({ ...req.body, userId: req.user.id })
    .then((success) => {
      res.send(success);
    })
    .catch(next);
}

function _delete(req, res, next) {
  // users can delete their own account and admins can delete any account
  if (req.user.role !== Role.Admin) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  userHelper
    .delete(req.params.id)
    .then(() => res.json({ message: "Account deleted successfully" }))
    .catch(next);
}
