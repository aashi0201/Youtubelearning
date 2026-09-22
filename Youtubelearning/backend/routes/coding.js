const express = require("express");
const router = express.Router();
const codingController = require("../controllers/codingController");
const auth = require("../middleware/auth");

router.use(auth);

router.get("/verification-token", codingController.getVerificationToken);
router.post("/verify-platform", codingController.verifyPlatformOwnership);
router.get("/inspect", codingController.inspectHandles);
router.get("/tracker/:userId", codingController.getTrackerStats);
router.post("/tracker/update", codingController.updateProfiles);
router.post("/tracker/disconnect", codingController.disconnectProfile);
router.get("/activity/today", codingController.getTodayActivity);
router.get("/leaderboard", codingController.getLeaderboard);
router.post("/solve", codingController.markProblemSolved); // Manual trigger
router.get("/contests", codingController.getUpcomingContests);

module.exports = router;

