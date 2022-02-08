const transHelper = require("./trans.service");
const postHelper = require("../post/post.service");
const Joi = require("joi");
const validateRequest = require("middleware/validate-request");
const Role = require("helper/role");

module.exports = {
  getById,
  getByUserId,
  createSchema,
  create,
  updateSchema,
  update,
  delete: _delete,
  deleteAllByPostIdSchema,
  deleteAllByPostId,
};

function getByUserId(req, res, next) {
  if (!req.user.id && req.user.role !== Role.Admin) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  transHelper
    .getByUserId(req.user.id)
    .then((trans) => res.json(trans))
    .catch(next);
}

function getById(req, res, next) {
  transHelper
    .getByTransId(req.params.id, req.user.id)
    .then((trans) => {
      delete trans.id;
      delete trans.ownerId;
      res.json(trans);
    })
    .catch(next);
}
function createSchema(req, res, next) {
  const schema = Joi.object({
    commentId: Joi.string().required(),
    postId: Joi.string().required(),
    content: Joi.string(),
    rootCommentId: Joi.string().required(),
  });
  validateRequest(req, next, schema);
}

async function create(req, res, next) {
  try {
    const post = await postHelper.getByIdentity(req.user.id, req.body.postId);
    if (!post) throw new Error("Post not found");
    req.body.ownerId = req.user.id;
    transHelper
      .create(req.body)
      .then((trans) => {
        delete trans.id;
        delete trans.ownerId;
        res.json(trans);
      })
      .catch(next);
  } catch (err) {
    res.status(403).json({ message: "Có lỗi xảy ra, vui lòng thử lại hoặc báo lỗi" });
  }
}

function updateSchema(req, res, next) {
  const schemaRules = {
    commentId: Joi.string().empty(/.*/),
    postId: Joi.string().empty(/.*/),
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
    if (!req.user.id && req.user.role !== Role.Admin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    return transHelper
      .update(req.params.id, req.user.id, req.body)
      .then(() => res.json({ message: "Update success" }))
      .catch(next);
  } catch (err) {
    return res.status(403).json({ message: "Có lỗi xảy ra" });
  }
}

async function _delete(req, res, next) {
  try {
    if (!req.user.id && req.user.role !== Role.Admin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    return transHelper
      .delete(req.params.id, req.user.id)
      .then(() => res.json({ message: "Trans deleted successfully" }))
      .catch(next);
  } catch (err) {
    return res.status(403).json({ message: "Có lỗi xảy ra" });
  }
}

function deleteAllByPostIdSchema(req, res, next) {
  const schemaRules = {
    postId: Joi.string(),
  };
  // only admins can update specified field
  if (req.user.role === Role.Admin) {
    //schemaRules.role = Joi.string().valid(Role.Admin, Role.User).empty('');
  }

  const schema = Joi.object(schemaRules);
  validateRequest(req, next, schema);
}

async function deleteAllByPostId(req, res, next) {
  try {
    if (!req.user.id && req.user.role !== Role.Admin) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    transHelper
      .deleteAllByPostId(req.body.postId, req.user.id)
      .then(() => res.json({ message: "Trans in post deleted successfully" }))
      .catch(next);
  } catch (err) {
    return res.status(403).json({ message: "Có lỗi xảy ra" });
  }
}
