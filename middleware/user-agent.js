module.exports = getUserAgent;
function getUserAgent(req, res, next) {
  res.userAgent = req.get("User-Agent");
  next();
}
