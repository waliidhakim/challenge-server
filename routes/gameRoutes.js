const express = require('express');
const createError = require('http-errors');
const mongoose = require('mongoose');
const authController = require('../controllers/authController');
const gameController = require('../controllers/gameController');

const router = express.Router();

router
.route("/")
.get(authController.protect,authController.restrictTo('admin'),gameController.getAll)
.post(authController.protect,gameController.create);

router
.route("/:id")
.post(authController.protect,gameController.startGame)

module.exports = router;