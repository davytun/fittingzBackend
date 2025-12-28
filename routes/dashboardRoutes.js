const express = require("express");
const DashboardController = require("../controllers/dashboardController");
const { authenticateJwt } = require("../middlewares/authMiddleware");

const router = express.Router();
router.use(authenticateJwt);

router.get("/", DashboardController.getBatchData);
router.get("/stats", DashboardController.getStats);
router.get("/client/:clientId", DashboardController.getClientDetails);

module.exports = router;