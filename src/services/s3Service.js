const AWS = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");

// Баптауларды қатаң түрде тікелей объект арқылы береміз
const s3 = new AWS.S3({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  endpoint: "https://s3.ps.kz", // Endpoint-ты қарапайым жол ретінде беріп көрейік
  s3ForcePathStyle: true, // PS.kz үшін бұл міндетті
  signatureVersion: "v4",
  region: "kz", // Кейбір SDK нұсқалары үшін 'us-east-1' деп жазу көмектесуі мүмкін, бірақ 'kz' дұрысырақ
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET,
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      const fileName = `products/${Date.now()}-${file.originalname}`;
      cb(null, fileName);
    },
  }),
});

module.exports = upload;
