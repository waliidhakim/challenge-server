const express = require('express');
const createError = require('http-errors');
const mongoose = require('mongoose');

const CardMg = require('../db/mongo/models/cardModel');
const CardPg = require('../db/postGres/models/cardPostgresModel');


exports.getAll = async (req, res, next) => {
    try {
        const cards = await CardMg.find({});
        res.send(cards);
    } catch (error) {
        console.log(error.message);
    }
}

exports.getAllbutOne = async (req, res, next) => {
    try {
        const { id } = req.params;
        const cards = await CardMg.find({ _id: { $ne: id } });
        res.send(cards);
    } catch (error) {
        console.log(error.message);
    }
}

exports.create
