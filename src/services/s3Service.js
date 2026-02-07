const AWS = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");

// PS.kz S3 баптаулары
const s3 = new AWS.S3({
  endpoint: "https://s3.ps.kz", // PS.kz стандарты
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  s3ForcePathStyle: true, // PS.kz үшін міндетті параметр
  region: "kz", // Кез келген мән, бірақ бос болмауы керек
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: "qamqor-images", // Сен құрған контейнер аты
    acl: "public-read", // Суреттер бәріне көрінуі үшін
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      cb(null, `products/${Date.now().toString()}-${file.originalname}`);
    },
  }),
});

module.exports = upload;
