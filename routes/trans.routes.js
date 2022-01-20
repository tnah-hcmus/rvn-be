const express = require("express");
const router = express.Router();
const authorize = require("middleware/authorize");
const transController = require("controllers/trans/trans.controller");

router
  .route("/single/:id")
  .get(transController.getById)
  .put(authorize(), transController.updateSchema, transController.update)
  .delete(authorize(), transController.delete);
router
  .route("/")
  .post(authorize(), transController.createSchema, transController.create);
module.exports = router;
