const express = require("express");
const router = express.Router();
const authorize = require("middleware/authorize");
const Role = require("helper/role");
const uploadController = require("controllers/upload/upload.controller");

router
  .route("/single/:id")
  .get(authorize(), uploadController.getById)
  .put(
    authorize(Role.Admin),
    uploadController.updateSchema,
    uploadController.update
  )
  .delete(authorize(Role.Admin), uploadController.delete);
router
  .route("/")
  .get(authorize(), uploadController.init)
  .post(authorize(), uploadController.createSchema, uploadController.create);

module.exports = router;
