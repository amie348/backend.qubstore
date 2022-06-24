const mongoose = require("mongoose");


const downloaderSchema = new mongoose.Schema({
  name: {
    type: String,
    },
  email :{
    type: String
    },
  language:{
    type:String
  }
});

const fileDownloaderModel = mongoose.model("fileDownloader", downloaderSchema);

module.exports = fileDownloaderModel;
