// importing mongoose package
const mongoose = require("mongoose");



// defining transection schema 
const transectionSchema = mongoose.Schema({

    _id: {
        type: mongoose.Types.ObjectId
    },
    to: {
      type: String,
      trim: true,
      ref: `User`
    },
    from: {
        type: String,
        trim: true
    },
    account: {
        type: String,
        trim: true
    },
    amount: {
        type: Number
    },
    status: {
        type: Boolean,
        trim: true,
        default: false
    },

}, {

    timestamps: true

});



//  exporting schema as module
module.exports = mongoose.model(`Transection`, transectionSchema);