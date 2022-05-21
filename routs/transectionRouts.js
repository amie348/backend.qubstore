const express = require("express");
const transectionRouter = express.Router();
const { protect } = require(`../controller/authController`);
const { createTransection, getSuccessedTransections, getPendingTransections, updateTransection } = require(`../controller/transection.controller`);



transectionRouter.get(`/get-success` , protect, getSuccessedTransections);
transectionRouter.get(`/get-pending` , protect, getPendingTransections);
transectionRouter.post(`/make-request` , protect, createTransection);
transectionRouter.patch(`/complete-transection` , protect, updateTransection);



module.exports = {

  transectionRouter

}