const express = require('express');
const createError = require('http-errors');
const mongoose = require('mongoose');
const cardController = require('../controllers/cardController');

const router = express.Router();

router.route("/").get(cardController.getAll);
router.route("/:id").get(cardController.getAllbutOne);

module.exports = router;