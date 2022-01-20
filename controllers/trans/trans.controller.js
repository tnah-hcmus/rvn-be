const transHelper = require("./trans.service");
const Joi = require("joi");
const validateRequest = require("middleware/validate-request");
const Role = require("helper/role");
const postHelper = require("../post/post.service");

module.exports = {
  getById,
  createSchema,
  create,
  updateSchema,
  update,
  delete: _delete,
};
function getById(req, res, next) {
  transHelper
    .getByTransId(req.params.id)
    .then(async (trans) => {
      try {
        if (trans) {
          const post = await postHelper.getByPostId(trans.postId);
          if (post.ownerId !== req.user.id && req.user.role !== Role.Admin)
            return res.status(401).json({ message: "Unauthorized" });
          else res.json(trans);
        } else res.sendStatus(404);
      } catch (e) {
        res.status(401).json({ message: "Error occur" });
      }
    })
    .catch(next);
}
function createSchema(req, res, next) {
  const schema = Joi.object({
    commentId: Joi.string().required(),
    postId: Joi.integer().required(),
    content: Joi.string(),
    rootCommentId: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

async function create(req, res, next) {
  try {
    const post = await postHelper.getByPostId(req.body.postId);
    if (post.ownerId !== req.user.id && req.user.role !== Role.Admin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    transHelper
      .create(req.body)
      .then((trans) => res.json(trans))
      .catch(next);
  } catch (err) {
    res.status(401).json({ message: "Error occur" });
  }
}

function updateSchema(req, res, next) {
  const schemaRules = {
    commentId: Joi.string().empty(/.*/),
    postId: Joi.integer().empty(/.*/),
    content: Joi.string(),
    rootCommentId: Joi.string().empty(/.*/),
  };

  // only admins can update specified field
  if (req.user.role === Role.Admin) {
    //schemaRules.role = Joi.string().valid(Role.Admin, Role.User).empty('');
  }

  const schema = Joi.object(schemaRules);
  validateRequest(req, next, schema);
}

async function update(req, res, next) {
  try {
    const post = await postHelper.getByPostId(req.params.id);
    if (post.ownerId !== req.user.id && req.user.role !== Role.Admin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    transHelper
      .update(req.params.id, req.body)
      .then((trans) => res.json(trans))
      .catch(next);
  } catch (err) {
    res.status(401).json({ message: "Error occur" });
  }
}

async function _delete(req, res, next) {
  try {
    const post = await postHelper.getByPostId(req.params.id);
    if (post.ownerId !== req.user.id && req.user.role !== Role.Admin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    transHelper
      .delete(req.params.id)
      .then(() => res.json({ message: "Trans deleted successfully" }))
      .catch(next);
  } catch (err) {
    res.status(401).json({ message: "Error occur" });
  }
  if (req.user.role !== Role.Admin) {
    return res.status(401).json({ message: "Unauthorized" });
  }
}
