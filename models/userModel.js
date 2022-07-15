const mongoose = require("mongoose");
const validator = require("validator");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const { dummyDp } = require(`../config`);

const userSchema = new mongoose.Schema({
  dp: {
    type: String,
    default: dummyDp
  },
  name: {
    type: String,
    unique: [true, "user must have unique name"],
    required: [true, "user must have a  name"],
  },
  email: {
    type: String,
    require: [true, "user must have a email "],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "user must have a password"],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    // only works on create and save
    type: String,
    required: [true, "User must have confirm  password"],
    select: false,
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Does not match the password",
    },
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  passwordChangedAt: {
    type: Date,
    select: true,
  },
  resetCode: {
    type: String,
    trim: true,
  },
  links: {
    type: [{
      apk: { type: String, required: true },
      link: { type: String, required: true },
      emails: { type: [String], trim: true },
      downloads: {type: Number, default: 0}
    }],
    default: []
  },
  downlaods: {
    type: Number,
    default: 0
  },
  pricePerDownlaod: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    default: 0
  },
  inviteId: {
    type:mongoose.Schema.Types.ObjectId,
    default: null
  },
  pending: {
    type: Number,
    default: 0
  },


  // allDownloads:[{
  //   date:{type: Date, required: true},
  //   price:{type: Number, required: true},
  //   downloads:{type: Number, required: true}
  // }],

  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: true,
  },
  account: {
    type: String,
    default: ``
  }

});

// bcrypt used for saving encrypted form of password to database
userSchema.pre("save", async function (next) {
  // it only run when password is modified
  if (!this.isModified("password")) return next();
  // hash the password with cost 12
  this.password = await bcrypt.hash(this.password, 12);
  // delete the password from password confirm
  this.passwordConfirm = undefined;
  next();
});

// bcrypt used to compare test1233 password to 12hgdgfsdfsdsd223ihidh
// this method available in every document
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return bcrypt.compare(candidatePassword, userPassword);
};

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// this is only for active users
userSchema.pre(/^find/, function (next) {
  // this is point current query
  this.find({
    active: {
      $ne: false,
    },
  });
  next();
});

userSchema.methods.changePasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimeStamp < changedTimeStamp;
  }
  return false;
};

userSchema.methods.createResetPasswordToken = function () {
  //create random reset token with crypto node module
  const resetToken = crypto.randomBytes(32).toString("hex");
  // create password reset  token for saving to database
  // its make more secures with createHash method of crypto
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  // 10 mint for changing password
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  // return simple reset token
  // console.log(resetToken);
  return resetToken;
};

userSchema.methods.createDownloadLinkToken = function () {
  //create random reset token with crypto node module
  const downloadLinkToken = crypto.randomBytes(32).toString("hex");
  // create password reset  token for saving to database
  // its make more secures with createHash method of crypto
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(downloadLinkToken)
    .digest("hex");
  // 10 mint for changing password
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  // return simple reset token
  // console.log(resetToken);
  return downloadLinkToken;
};

// referencing users
// userSchema.pre(/^find/, function (next) {
//   this.populate({
//     path: "users",
//     select: "firstName  email",
//   });
//   next();
// });

const User = mongoose.model("User", userSchema);
module.exports = User;
