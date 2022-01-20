const aws = require("aws-sdk");
const config = require("config/storage.config");

const s3 = new aws.S3({
  signatureVersion: config.signatureVersion,
  region: config.region,
  accessKeyId : process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey : process.env.AWS_SECRET_ACCESS_KEY,
});

const getSignedUrlForGetImage = (
  key,
  bucketName = process.env.BUCKET,
  expires = 3600
) => {
  return new Promise((resolve, reject) => {
    s3.getSignedUrl(
      "getObject",
      {
        Bucket: bucketName,
        Key: key,
        Expires: expires,
      },
      function (err, url) {
        if (err) throw new Error(err);
        resolve(url);
      }
    );
  });
};

const getSignedUrlForUploadImage = (key, type, expires = 10 * 60) => {
  let options = {
    Bucket: process.env.BUCKET,
    Key: key,
    Expires: expires,
    ACL: "public-read",
  };
  if (type) options.ContentType = type;
  return new Promise((resolve, reject) => {
    s3.getSignedUrl("putObject", options, function (err, url) {
      console.log(err);
      if (err) reject(err);
      resolve(url);
    });
  });
};

module.exports = {getSignedUrlForGetImage, getSignedUrlForUploadImage}
