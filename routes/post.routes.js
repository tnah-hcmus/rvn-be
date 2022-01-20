const express = require("express");
const router = express.Router();
const authorize = require("middleware/authorize");
const postController = require("controllers/post/post.controller");

// router
//   .route("/media")
//   .post(
//     authorize(),
//     postController.generateMediaSchema,
//     postController.generateMedia
//   );
router
  .route("/single/:id")
  .get(postController.getById)
  .put(authorize(), postController.updateSchema, postController.update)
  .delete(authorize(), postController.delete);
router
  .route("/")
  .get(authorize(), postController.getByUserId)
  .post(authorize(), postController.createSchema, postController.create);
module.exports = router;
