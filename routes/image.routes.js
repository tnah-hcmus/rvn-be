const express = require("express");
const router = express.Router();
const authorize = require("middleware/authorize");
const Role = require("helper/role");
const imageController = require("controllers/image/image.controller");

router
  .route("/single/:id")
  .get(authorize(), imageController.getById)
  .put(
    authorize(Role.Admin),
    imageController.updateSchema,
    imageController.update
  )
  .delete(authorize(), imageController.delete);
router
  .route("/")
  .get(authorize(), imageController.getByUserId)
  .post(
    authorize(Role.Admin),
    imageController.createSchema,
    imageController.create
  );
module.exports = router;
