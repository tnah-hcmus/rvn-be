const express = require("express");
const router = express.Router();
const authorize = require("middleware/authorize");
const transController = require("controllers/trans/trans.controller");

router
  .route("/single/:id")
  .get(authorize(), transController.getById)
  .put(authorize(), transController.updateSchema, transController.update)
  .delete(authorize(), transController.delete);
router
  .route("/")
  .get(authorize(), transController.getByUserId)
  .post(authorize(), transController.createSchema, transController.create)
  .delete(
    authorize(),
    transController.deleteAllByPostIdSchema,
    transController.deleteAllByPostId
  );
module.exports = router;
