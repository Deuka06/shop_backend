const AWS = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");

// PS.kz S3 баптаулары (v2 форматы)
const s3 = new AWS.S3({
  endpoint: "https://s3.ps.kz",
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  s3ForcePathStyle: true,
  signatureVersion: "v4", // Қауіпсіздік үшін қосылды
  region: "kz",
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET,
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE, // Файл түрін автоматты анықтау
    key: function (req, file, cb) {
      // Файлды products папкасына сақтау
      const fileName = `products/${Date.now()}-${file.originalname}`;
      cb(null, fileName);
    },
  }),
});

module.exports = upload;
