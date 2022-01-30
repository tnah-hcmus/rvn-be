const postHelper = require("./post.service");
const Joi = require("joi");
const validateRequest = require("middleware/validate-request");
const Role = require("helper/role");
const createUUID = require("helper/generate-uuid");

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
  if (!req.user.id && req.user.role !== Role.Admin) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  postHelper.getByUserId(req.user.id).then((posts) => res.json(posts)).catch(next);
}

function getById(req, res, next) {
  postHelper
    .getById(req.params.id)
    .then((post) => {
      if (post) {
        delete post.id;
        delete post.ownerId;
        res.json(post);
      } else res.sendStatus(404);
    })
    .catch(next);
}

function createSchema(req, res, next) {
  const schema = Joi.object({
    rawPostId: Joi.string().required(),
    subreddit: Joi.string().required(),
    title: Joi.string().required(),
    url: Joi.string().required(),
    mediaLink: Joi.string(),
    isPosted: Joi.boolean(),
    lastUpdated: Joi.string(),
  });
  validateRequest(req, next, schema);
}

function create(req, res, next) {
  req.body.ownerId = req.user.id;
  req.body.id = createUUID();
  postHelper
    .create(req.body)
    .then((post) => {
      delete post.id;
      delete post.ownerId;
      res.json(post);
    })
    .catch(next);
}

function updateSchema(req, res, next) {
  const schemaRules = {
    ownerId: Joi.number().empty(/.*/),
    rawPostId: Joi.string().empty(/.*/),
    subreddit: Joi.string().empty(/.*/),
    title: Joi.string().empty(/.*/),
    url: Joi.string().empty(/.*/),
    mediaLink: Joi.string(),
    isPosted: Joi.boolean(),
    lastUpdated: Joi.string(),
  };

  const schema = Joi.object(schemaRules);
  validateRequest(req, next, schema);
}

function update(req, res, next) {
  if (!req.user.id && req.user.role !== Role.Admin) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  postHelper
    .update(req.user.id, req.params.id, req.body, req.user.role === Role.Admin)
    .then((_) => res.json({ message: "update success post" }))
    .catch(next);
}

function _delete(req, res, next) {
  return postHelper
    .delete(req.params.id, req.user.id)
    .then(() => res.json({ message: "Post deleted successfully" }))
    .catch(next);
}
