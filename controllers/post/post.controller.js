const postHelper = require("./post.service");
const Joi = require("joi");
const validateRequest = require("middleware/validate-request");
const Role = require("helper/role");

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
  postHelper
    .getByUserId(req.user.id)
    .then((posts) => res.json(posts))
    .catch(next);
}

function getById(req, res, next) {
  postHelper
    .getByPostId(req.params.id)
    .then((post) => {
      return post ? res.json(post) : res.sendStatus(404);
    })
    .catch(next);
}

function createSchema(req, res, next) {
  const schema = Joi.object({
    ownerId: Joi.number().required(),
    rawPostId: Joi.string().required(),
    subreddit: Joi.string().required(),
    title: Joi.string().required(),
    mediaLink: Joi.string(),
    isPosted: Joi.boolean(),
  });
  validateRequest(req, next, schema);
}

function create(req, res, next) {
  postHelper
    .create(req.body)
    .then((post) => res.json(post))
    .catch(next);
}

function updateSchema(req, res, next) {
  const schemaRules = {
    ownerId: Joi.number().empty(/.*/),
    rawPostId: Joi.string().empty(/.*/),
    subreddit: Joi.string().empty(/.*/),
    title: Joi.string().empty(/.*/),
    mediaLink: Joi.string(),
    isPosted: Joi.boolean(),
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
    .then((post) => res.json(post))
    .catch(next);
}

function _delete(req, res, next) {
  postHelper
    .getByPostId(req.params.id)
    .then((post) => {
      if (post.ownerId !== req.user.id && req.user.role !== Role.Admin) {
        return res.status(401).json({ message: "Unauthorized" });
      } else {
        return postHelper
          .delete(req.params.id)
          .then(() => res.json({ message: "Post deleted successfully" }))
          .catch(next);
      }
    })
    .catch(next);
}
