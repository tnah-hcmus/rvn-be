module.exports = {
  acceptOrigin: process.env.DEV
    ? "http://localhost:8080"
    : "https://rvninc.net",
  secret: process.env.JWT_SECRET,
};
