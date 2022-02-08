const axios = require("axios");

function getPathFromUrl(url) {
  return url.split(/[?#]/)[0];
}

const parseUrlLink = (url) => {
  if (!url) return "";
  const regex = /(?:^.+?)(?:reddit.com\/r)(?:\/[\w\d]+){2}(?:\/)([\w\d]*)/g;
  const match = regex.exec(url);
  if (match && match.length > 1) return match[1];
  else return "";
};

const checkUrlExists = async (url) => {
  try {
    await axios.head(url);
    return true;
  } catch (error) {
    if (error.response.status >= 400) {
      return false;
    }
  }
};

module.exports = { parseUrlLink, getPathFromUrl, checkUrlExists };
