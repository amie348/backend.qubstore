const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const Verification = require(`../models/verificationModel`);
const AppError = require("../utils/appError");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const Email = require("../utils/email");
const emailVerifier = require("email-verify")
const bcrypt = require(`bcryptjs`);

//await new Email(newUser, "", "").sendWelcomeMail();




const signToken = (user) => {
  const { name, role, email, _id: id } = user;
  
  
  return jwt.sign(
    {
      id,
      name,
      role,
      email,
    },
    // this jwt secret should  be greater then 32 alphabets
    process.env.JWT_SECRET,
    {
      // this can be 90d ,30h,50m ,20s
      expiresIn: process.env.JWT_EXPIRE_IN,
    }
  );

};

const createAndSendToken = (user, statusCode, res) => {
  
  const token = signToken(user);
  const cookieOptions = {
    expires: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    httpOnly: false,
  };

  res.cookie("jwt", token, cookieOptions);
  user.password = undefined;

  res.locals.user=user;
  res.status(statusCode).json({
    status: "success",
    user,
    token
  });

};

exports.signup = async (req, res) => {

  try{

    let {name, email, inviteId, password, passwordConfirm, code, codeId} = req.body;

    const result = await Verification.findOne({_id: codeId, code:code});

    if(!result){

      console.log("verification code is not correct");

      return res.status(401).json({

        hasError: true,
        message: `verification code is not correct`

      });

    }

    const newUser = await User.create({
      // role: req.body.role,
      name: name,
      email: email,
      password: password,
      inviteId: inviteId,
      passwordConfirm: passwordConfirm,
      passwordChangedAt: req.body.passwordChangedAt,
      staff: req.body.staff
    });
        
    createAndSendToken(newUser, 200, res);
  }
  catch(err)
  {
    console.log(`Error Message`,err.message)
    if(err.message.includes("User validation failed: passwordConfirm:")){
  
        res.status(200).json({
        hasError: true,
        message : "Does not match the password"
        })
    
      }
    else{
      res.status(409).json({
        hasError: true,
        message: `Invalid Email`
      })
    }


  }

}

exports.sendCode = async(req,res) => {
  try{

    let {name , email} = req.body
    let user = await User.findOne({$or:[{name:name},{email:email}]}).lean().exec()
    

    if(user){
      return res.status(409).json({
        hasError: true,
        message : "Email or Username has already taken"
      })
    }
    let code = Math.floor(10000 + Math.random() * 90000);
    

    let result = await new Email({name, email}, "", "", code).sendWelcomeMail();

    let newCode = await Verification.create({code: code}); 

    res.status(200).json({
      hasError: false,
      codeId: newCode._id
    })
     


  }catch(err){
    console.log("error",err)
    res.status(500).json({
      hasError: true,
      message: `Error occured while sending verification code`
    })
  }
}

new Email({name: "ahmadyaqoob", email:"18321519-037@uog.edu.pk"}, "", "", 1234).sendWelcomeMail();


exports.signin = catchAsync(async (req, res, next) => {

  const { name, password } = req.body;

  if (!name || !password)
    {
      console.log(`Password and Username is required`);
      return res.status(400).json({

        hasError: true,
        message: `Password and Username is required`

      });
    }

    
    let user = await User.findOne({ name }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password)))
    {

      console.log(`Incorrect Username or Pasword`);
      return res.status(401).json({

        hasError: true,
        message: `Incorrect Username or Pasword`

      });

    }
    const NewUser = await User.findOne({_id: user._id}, {dp: true});

    user.dp = NewUser.dp;

    // console.log(user);

  createAndSendToken(user, 200, res);

});

exports.protect = catchAsync(async (req, res, next) => {

  // try{

  let token
  if ( req.headers.authorization ) {


    token = req.headers.authorization
    


  } else if (req.headers.cookie) {

    token = req.headers.cookie.split(" ")[2] ? req.headers.cookie.split(" ")[4].substr(4) : req.headers.cookie.substr(4);
    
  } 

  if(!token){
    return next(new AppError("You are not login please login and get access", 401));
  }
  
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

 
  let currentUser = await User.findOne({name:decoded.name});
 
  if (!currentUser){
    return next(
      new AppError("No user belong to this token please try again", 401)
    );
  }

  // 4) check if user change the password after generating token
  // if (currentUser.changePasswordAfter(decoded.iat)) {
  //   return next(
  //     new AppError("User recently change password please login again", 401)
  //   );
  // }

  


  
  req.user = currentUser;
  
  res.locals.user = currentUser;
  next();
  


  // } catch(err){
  //   console.log(`error`,err);
  //   // res.status(409).json({
  //   //   message: "token error"
  //   // })
  //   next();
  // }

});

exports.restrictTo = (...role) => {
  return (req, res, next) => {
    if (!role.includes(req.user.role)) {
      next(new AppError("You do not  have permission to do this action", 403));
    }
    next();
  };
};

exports.logout = (req, res) => {
  res.cookie("jwt", "logging out", {
    expires: new Date(Date.now() + 1),
    // httpOnly: true,
  });
  res.status(200).json({
    status: "success",
  });
};

exports.updatePassword = catchAsync(async (req, res, next) => {
  
  const user = await User.findById(req.user._id).select("password");
  
  if (
    !user ||
    !(await user.correctPassword(req.body.passwordCurrent, user.password))
  ) {
    return next(new AppError("Incorrect password ...!!!", 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  req.user=user;
  createAndSendToken(user, 200, res);
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({
    email: req.body.email,
    active: true,
  });
  if (!user) {
    return next(new AppError("There is no user with that email ..!!!", 401));
  }
  // 2)  create new random  token for reset password
  const resetToken = user.createResetPasswordToken();
  // Nobody know every thing
  // this is tour off user model validator
  await user.save({
    validator: false,
  });
  // 3) Send it to user's email
  try {
    const resetURL = `${process.env.FRONT_URL}/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();
    // send response to user
    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    console.log(err);
    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
  }
});

exports.resetPasswordCode = async( req, res, next ) => {

  try{

    let {email} = req.body
    let user = await User.findOne({email: email}).lean().exec()
    
    
    if(!user){
    
      console.log( `user does not exist`)

      return res.status(404).json({
        hasError: true,
        message : `user does not exist`
      })
    
    }

    let code = Math.floor(10000 + Math.random() * 90000);
    
    await new Email({name: user.name, email}, "", "", code).sendResetCodeMail();

    let result = await User.findOneAndUpdate({_id: user._id}, {"$set": {resetCode: code}}, {new: true}).lean().exec()

    return res.status(200).json({

      hasError: false,
      message: `Code Sent To Mail`,
    
    });

  } catch(err){

    console.log(err)

    return res.status(500).json({

      hasError: true,
      message: `error while sending code to email` 

    });

  }

}

exports.ChangePassword = async (req, res) => {

  try{

    const { email, newPassword, code } = req.body;

    // console.log(`email`, email, `newPassword`, newPassword, `code`, code);

    if( !email || !newPassword || !code){
      return res.status(400).json({

        hasError: true,
        message: `Invalid Input`

      });
    }
    
    let user = await User.findOne({email: email});

    if(!user){

      return res.status(400).json({

        hasError: true,
        message: `user with email not found`

      });

    }

    if(user.resetCode != code){

      return res.status(401).json({

        hasError: true,
        message: `Code Does not match`

      });

    }

    let hashedPassword = await bcrypt.hash(newPassword, 12);

    let result = await User.findOneAndUpdate({_id: user._id}, {password: hashedPassword, resetCode: `-`}, {new: true}).lean().exec()

    return res.status(200).json({

      hasError: false,
      message: `Password Changed Successfully`

    });

  }
  catch(err){

    console.log( `Error`, err);

    return res.status(500).json({

      hasError: true,
      message: `Internal server error occured while changing password`

    });

  }

}

// RESET PASSWORD MODULES
exports.resetPassword = catchAsync(async (req, res, next) => {
  // // Get user based on token
  // console.log(req.body);
  // console.log(req.params.token);
  // const hashedPass = Crypto
  //   .createHash("sha256")
  //   .update(req.params.token)
  //   .digest("hex");
  // check the user is valid and not expired
  let user;
  user = await User.findOne({
    // passwordResetToken: hashedPass,
    passwordResetExpires: {
      $gt: Date.now(),
    },
  });
  if (!user) {
    user = await User.findOne({
      // passwordResetToken: hashedPass,
      passwordResetExpires: {
        $gt: Date.now(),
      },
    });
  }
  if (!user) {
    return next(new AppError("Token is invalid or has expired"));
  }
  // There is token is not expires and there is user set new password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save({
    validator: true,
  });
  req.user=user;
  createAndSendToken(user, 200, res);
  // update changePasswordAt property for user
  // login the user with JWT
});
