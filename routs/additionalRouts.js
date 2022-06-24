const express = require(`express`);

const additionalRouter = express.Router();


const { downloadRhapsodyDoc } = require(`../controller/additionalController`);


additionalRouter.post(`/download/docs/rhapsody`, downloadRhapsodyDoc);



module.exports = {

    additionalRouter

}