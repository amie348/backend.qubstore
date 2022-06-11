const mongoose = require(`mongoose`);



const verificationSchema = mongoose.Schema({

  code: {
    type: String,
    trim: true
  }

})



module.exports = mongoose.model(`verification`, verificationSchema);