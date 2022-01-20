const axios = require("axios");
const queryString = require("querystring");
require("dotenv").config();

const getFacebookUrl = () => {
  const stringifiedParams = queryString.stringify({
    client_id: process.env.FB_APP_ID,
    redirect_uri: process.env.FB_REDIRECT_URL,
    scope: "email", // comma seperated string
    response_type: "code",
    auth_type: "rerequest",
    display: "popup",
  });
  return `https://www.facebook.com/v8.0/dialog/oauth?${stringifiedParams}`;
};

const getAccessTokenFromCode = async (code) => {
  try {
    const { data } = await axios({
      url: "https://graph.facebook.com/v8.0/oauth/access_token",
      method: "get",
      params: {
        client_id: process.env.FB_APP_ID,
        client_secret: process.env.FB_APP_SECRET,
        redirect_uri: process.env.FB_REDIRECT_URL,
        code,
      },
    });
    return data.access_token;
  } catch (e) {
    throw e;
  }
};
const getFacebookUserData = async (code) => {
  try {
    const accessToken = await getAccessTokenFromCode(code);
    const { data } = await axios({
      url: "https://graph.facebook.com/me",
      method: "get",
      params: {
        fields: ["id", "email", "first_name", "last_name"].join(","),
        access_token: accessToken,
      },
    });
    const { id, email, first_name, last_name } = data;
    return { password: id, email, name: first_name + " " + last_name };
  } catch (e) {
    throw e;
  }
};
module.exports = { getFacebookUserData, getFacebookUrl };
