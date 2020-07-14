const router = require("express").Router();

router.get("/aa", (req, res, next) => {
  try {
    console.log("---------i got there");
    res.json("carwaler routes");
  } catch (error) {
    console.log(error, "------error");
  }
});
module.exports = router;
