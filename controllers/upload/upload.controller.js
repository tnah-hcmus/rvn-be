const uploadHelper = require("./upload.service");
const Joi = require("joi");
const validateRequest = require("middleware/validate-request");
const Role = require("helper/role");
module.exports = {
  getById,
  init,
  createSchema,
  create,
  updateSchema,
  update,
  delete: _delete,
};

function getById(req, res, next) {
  uploadHelper
    .getById(req.params.id)
    .then((upload) => {
      return upload ? res.json(upload) : res.sendStatus(404);
    })
    .catch(next);
}

async function init(req, res, next) {
  req.body.number = req.body.number || 1;
  req.body.createThumbnail = req.body.createThumbnail == false ? false : true;
  try {
    let allUrlPromise = [];
    for (let i = 0; i < req.body.number; i++) {
      allUrlPromise.push(uploadHelper.init(req.body));
    }
    const urlList = await Promise.all(allUrlPromise);
    res.json(urlList.length === 1 ? urlList[0] : urlList);
  } catch (err) {
    next(err);
  }
}

function createSchema(req, res, next) {
  const schema = Joi.object({
    fileName: Joi.string().required(),
    uploadId: Joi.string().required(),
    imageId: Joi.string().required(),
    thumbnailId: Joi.string(),
  });
  validateRequest(req, next, schema);
}

function create(req, res, next) {
  if (!req.user.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  uploadHelper
    .create(req.body, req.user.id)
    .then((upload) => res.json(upload))
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
  //admins can update any upload, maybe moderator in future so this code still here although i except it through authorize() middleware
  if (req.user.role !== Role.Admin) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  uploadHelper
    .update(req.params.id, req.body)
    .then((upload) => res.json(upload))
    .catch(next);
}

function _delete(req, res, next) {
  //admins can update any payment
  if (req.user.role !== Role.Admin) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  uploadHelper
    .delete(req.params.id)
    .then(() => res.json({ message: "Upload deleted successfully" }))
    .catch(next);
}
