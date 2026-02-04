const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController"); // Контроллер файлының жолын тексер

// POST сұранысы келгенде тапсырыс жасау
router.post("/", orderController.createOrder);

module.exports = router;
