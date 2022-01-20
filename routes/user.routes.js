const express = require("express");
const router = express.Router();
const authorize = require("middleware/authorize");
const Role = require("helper/role");
const userController = require("controllers/user/user.controller");
const uploadController = require("controllers/upload/upload.controller");

router
  .route("/single/:id")
  .get(authorize(), userController.getById)
  .post(authorize(), userController.updateSchema, userController.update)
  .put(authorize(), userController.updateSchema, userController.update)
  .delete(authorize(Role.Admin), userController.delete);
router
  .route("/avatar")
  .get(authorize(), uploadController.init)
  .post(
    authorize(),
    userController.updateAvatarSchema,
    userController.updateAvatar
  );
router
  .route("/location")
  .get(authorize(), userController.getById)
  .post(
    authorize(),
    userController.editFavouriteLocationSchema,
    userController.editFavouriteLocation
  );
router
  .route("/me")
  .get(authorize(), userController.getById)
  .post(authorize(), userController.updateSchema, userController.update)
  .put(authorize(), userController.updateSchema, userController.update);
router
  .route("/")
  .get(authorize(Role.Admin), userController.getAll)
  .post(
    authorize(Role.Admin),
    userController.createSchema,
    userController.create
  );
module.exports = router;
