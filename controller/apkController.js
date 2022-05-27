const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Category = require("../models/categoryModel");
const Apk = require("../models/apkModel");
const multer = require("multer");
const { promisify } = require("util");
const Email = require("../utils/email");
const jwt = require("jsonwebtoken");
const path = require("path");
const Statics = require("../models/staticsModel");
const User = require("../models/userModel");
const moment = require("moment")
const fs = require("fs");
const https = require(`https`);
const axios = require(`axios`);
const mongoose = require("mongoose");
const { isValidObjectId } = require(`mongoose`);
// var public = path.join(__dirname, '../public/apk/');


// multiple files uploads

const multipleImagesStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/img/");
  },

  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now() + file.originalname);
  },
});

const multipleImagesFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Please upload images", 400), false);
  }
};

const multiImageUpload = multer({
  storage: multipleImagesStorage,
  fileFilter: multipleImagesFilter,
});

exports.uploadMultiImages = multiImageUpload;
// save to the database in image array

exports.saveImages = catchAsync(async (req, res, next) => {
  req.body.images = [];
  if (req.files) {
    req.files.map(async (file) => {
      req.body.images.push(file.filename);
    });
  }
  next();
});

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/apk/");
  },
  filename: (req, file, cb) => {
    cb(null, `apk-${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("application")) {
    cb(null, true);
  } else {
    cb(new AppError("No apk! Please upload only apk file", 400), false);
  }
};
// const imageStorage = multer.memoryStorage();

const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/img/");
  },
  filename: (req, file, cb) => {
    // req.body.image= `image-${req.user.id}-${Date.now()}.jpeg`;
    cb(null, `image-${req.user.id}-${Date.now()}.jpeg`);
  },
});

// validate for image
const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("No image! Please upload only images", 400), false);
  }
};

const uploadFile = multer({
  storage: fileStorage,
  fileFilter: fileFilter,
});

const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
});

exports.uploadImage = uploadImage.single("image");

exports.uploadFile = uploadFile.single("file");

exports.uploadFileHandler = catchAsync(async (req, res) => {
  const filename = req.file ? req.file.filename : "No_file.apk";
  // console.log({apk:req.file});
  const title = req.params.title;
  const result = await Apk.findOneAndUpdate({ title }, { file: filename });
  res.status(201).json({
    data: result,
  });
});

exports.uploadImagesHandler = catchAsync(async (req, res) => {
  const title = req.params.title;
  const images = req.body.images;
  const result = await Apk.findOneAndUpdate({ title }, { images });
  res.status(201).json({
    data: result,
  });
});

exports.updateStatics = catchAsync(async (req, res) => {
  const filename = req.params.image;
  await Statics.findOneAndUpdate({ title: "client" }, { image: filename });
  console.log({ filename });
  res.status(200).json({
    message: "statics updated successfully"
  })
});

exports.updateApk = catchAsync(async (req, res) => {
  console.log(req.body, 'abdulrehman');
  const user = req.user;
  const { apkTitle } = req.params;
  const actions = user.role == 'admin' ? 'approved' : 'pending';
  const hot = req.body.hot == "true";
  const top = req.body.top == "true";
  const feature = req.body.feature == "true";
  const trending = req.body.trending == "true";
  // const filename = req.file.filename;
  const {
    requirements,
    category,
    subCategory,
    tags,
    title,
    developer,
    description,
    version,
    // website,
  } = req.body;
  // console.log({ apkTitle });
  // if (!title )
  //   return next(new AppError("please enter complete detail", 404));
  const apk = await Apk.findOneAndUpdate({ title: apkTitle }, {
    creator: req.user.name,
    actions,
    user,
    version,
    category,
    subCategory,
    requirements,
    title,
    tags,
    developer,
    // image: filename,
    description,
    hot,
    // officialWebsite: website,
    editorChoice: feature,
    trending: trending,
    top,
  });
  if (req.file)
    await Apk.findOneAndUpdate({ title: apkTitle }, { image: req.file.filename });
  res.status(201).json({
    data: apk,
  });
});

exports.addApk = catchAsync(async (req, res, next) => {
  // console.log({ body: req.body, image: req.file });
  const user = req.user;
  const actions = user.role == 'admin' ? 'approved' : 'pending';
  const hot = req.body.hot == "true";
  const top = req.body.top == "true";
  const feature = req.body.feature == "true";
  const trending = req.body.trending == "true";
  const filename = req.file.filename;
  const {
    requirements,
    category,
    subCategory,
    tags,
    title,
    developer,
    description,
    version,
    website,
  } = req.body;
  console.log({ description });
  if (!title || !filename)
    return next(new AppError("please enter complete detail", 404));
  const apk = await Apk.create({
    creator: req.user.name,
    actions,
    user,
    version,
    category,
    subCategory,
    requirements,
    title,
    tags,
    developer,
    image: filename,
    description,
    hot,
    officialWebsite: website,
    editorChoice: feature,
    trending: trending,
    top,
  });
  res.status(201).json({
    data: apk,
  });
});

exports.getAllApk = catchAsync(async (req, res) => {
  const allApk = await Apk.find();
  res.status(201).json({
    data: allApk,
  });
});

exports.allApprovedApk = catchAsync(async (req, res) => {
  const allApk = await Apk.find({ actions: 'approved' });
  res.status(201).json({
    data: allApk,
  });
});

exports.getApk = catchAsync(async (req, res) => {
  
  const { apkId } = req.params;
  
  console.log(`apkId`, apkId)

  
  const apk = await Apk.findOne({ _id: apkId, actions: 'approved' }, {reviews: 0}).populate('user', "name");
  
  const stats = fs.statSync(path.join(__dirname, `../public/apk/${apk.file}`));

  stats.size;


  let total_reviews = apk.Rating_count.one + apk.Rating_count.two + apk.Rating_count.three + apk.Rating_count.four + apk.Rating_count.five

  let average_rating = 0;

  let total_rating = apk.Rating_count.one + apk.Rating_count.two*2 + apk.Rating_count.three*3 + apk.Rating_count.four*4 + apk.Rating_count.five*5 

  average_ratio = (apk.average_rating / 5) * 100;
  Rating_ratio = {
    one: (apk.Rating_count.one / total_reviews) * 100,
    two: (apk.Rating_count.two / total_reviews) * 100,
    three: (apk.Rating_count.three / total_reviews) * 100,
    four: (apk.Rating_count.four / total_reviews) * 100,
    five: (apk.Rating_count.five / total_reviews) * 100,
  }

  // console.log("Total Reviews", total_reviews);
  // console.log("Average Rating", average_rating);
  // console.log("Rating Count", Rating_count);
  // console.log("Rating Ratio", Rating_ratio);
  // console.log("Average Ratio", average_ratio);

  // const result = Apk.findOneAndUpdate({_id: apkId}, { average_rating: average_rating ? average_rating: 0  }).lean().exec();


  res.status(200).json({
    data: apk,
    total_reviews,
    Rating_ratio,
    Rating_count: apk.Rating_count,
    average_ratio,
    size: stats.size
  });

});

exports.getSameCateApps = catchAsync(async (req, res) => {
  console.log("cares", req.params.cate)
  let cate = req.params.cate
  console.log("cate", typeof cate)
  while (cate.includes("_")) {
    cate = cate.replace("_", " ")
  }
  while (cate.includes("-")) {
    cate = cate.replace("-", "&")
  }
  console.log({ cate });
  const apk = await Apk.find({ actions: 'approved', subCategory: cate });
  res.status(200).json({
    data: apk,
  });
});


exports.trendingApks = catchAsync(async (req, res) => {
  const apk = await Apk.find({ actions: 'approved', trending: true });
  res.status(200).json({
    data: apk,
  });
});

exports.papularApks = catchAsync(async (req, res) => {
  const allApk = await Apk.find({ actions: 'approved', createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } });
  res.status(201).json({
    data: allApk,
  });
});

exports.deleteApk = catchAsync(async (req, res) => {
  const title = req.params.title;
  const rs = await Apk.findOneAndRemove({ title });
  console.log({ title, rs });
  const data = await Apk.find();
  res.status(201).json({
    data,
  });
});

exports.updateActions = catchAsync(async (req, res) => {
  await Apk.findOneAndUpdate(
    { title: req.body.title },
    { actions: req.body.actions }
  );
  console.log({ title: req.body.title, actions: req.body.actions });
  const updatedApk = await Apk.findOne({ title: req.body.title });
  res.status(201).json({
    data: updatedApk,
  });
});

exports.addCategory = catchAsync(async (req, res) => {
  const { category, slug } = req.body;
  await Category.create({
    category,
    slug,
  });
  const allCate = await Category.find();
  res.status(201).json({
    data: allCate,
  });

  // const apk = await Category.findOne({ "category.name": "games" });
  // console.log(apk);
  // const [...subCate] = apk.category.subCategory;
  // subCate.push("Fun");
  // const result = await Category.findByIdAndUpdate(apk._id, {
  //   "category.subCategory": subCate,
  // // });
  // const apk = await Category.find();
  // const names = apk.map((e) => e.category.name);
});

exports.getSubcategories = catchAsync(async (req, res) => {
  const data = await Category.findOne({ category: req.params.cate });
  res.status(200).json({ data });
});

exports.deleteSubcategory = catchAsync(async (req, res) => {
  const data = await Category.findOne({ category: req.params.cate });
  const rmc = data.subCategory.filter(d => d.name !== req.body.name);
  // console.log({name:req.body.name});
  await Category.findOneAndUpdate({ category: req.params.cate }, { subCategory: rmc });
  res.status(200).json({ data, rmc });
});

exports.addSubCategory = catchAsync(async (req, res) => {
  console.log(req.body);
  const { cate } = req.params;
  const { slug, subCate } = req.body;
  const filename = req.file.filename;
  const newSubCate = { name: subCate, image: filename, slug: slug };
  const category = await Category.findOne({ category: cate });
  category.subCategory.push(newSubCate);
  await Category.findByIdAndUpdate(category._id, {
    subCategory: category.subCategory,
  });
  const allCate = await Category.find();
  res.status(201).json({
    data: allCate,
  });
});


exports.editSubCategory = catchAsync(async (req, res) => {

  console.log("editing");

  const { cate, subcate } = req.params;

  const { slug } = req.body;
  const filename = req.file ? req.file.filename : null;

  const newSubCate = { name: subcate, slug: slug };
  console.log(newSubCate);
  var SubCategory = await Category.findOne({ category: cate, "subCategory.name": subcate }, { "subCategory.$": true, _id: false });
  console.log("SubCategory", SubCategory)
  UpdatedSubCategory = {
    ...newSubCate,
    image: filename ? filename : SubCategory.subCategory[0].image
  }
  console.log("SubCategory", UpdatedSubCategory)

  const updateResult = await Category.findOneAndUpdate({ category: cate, "subCategory.name": subcate }, { $set: { "subCategory.$": UpdatedSubCategory } }, { new: true })

  const allCate = await Category.find();
  res.status(201).json({
    allCate,
    message: "SubCategory  Updated "
  });

});


exports.removeCategory = catchAsync(async (req, res) => {
  const cate = req.params.cate;
  await Category.findOneAndRemove({ category: cate });
  const allCate = await Category.find();
  res.status(201).json({
    data: allCate,
  });
});

exports.getAllCate = catchAsync(async (req, res) => {
  const data = await Category.find();
  res.status(200).json({ data });
});

exports.getOneApk = catchAsync(async (req, res) => {
  const { title } = req.params;
  console.log({ title });
  const data = await Apk.findOne({ title });
  console.log("APK", data);
  res.status(200).json({ data });

});

exports.getStates = catchAsync(async (req, res) => {
  const data = await Category.find();
  res.status(200).json({ data });
});

exports.getDownload = catchAsync(async (req, res) => {

  try {
    const [
      // { Token },
       {apkId}] = [
        //  req.body,
          req.params];
    
    let updateData = {};
    
    // const {expireDate, mail, userId, } = await promisify(jwt.verify)(Token, process.env.JWT_SECRET);

    
    
    // // console.log({ title }, { date, id })
    
    // let isExpired = moment().isAfter(moment(expireDate).format())
    
    // if (isExpired) {
    //   return res.status(200).jsn({
    //     hasError: true,
    //     message: "your download link is expired"
    //   })
    // }

    const { file, downloads, remaining } = await Apk.findOne({ _id: apkId });



    if (fs.existsSync(path.join(__dirname, `../public/apk/${file}`))) {
     
      updateData.downloads = downloads + 1 
     
      // if (userId) {

      //   if(remaining == 0){
      //     return res.status(200).json({

      //       hasError: true,
      //       expired: true

      //     })
      //   }

      //   let user = await User.findById({ _id: userId });
        
      //   let link;

      //   user.links.forEach(Link => {
      //     if (Link[`apk`] === title) {
      //       link = Link
      //       return
      //     }
      //   });
        
      //   updateData.remaining = remaining - 1;

      //   if(updateData.remaining == 0) {
      //     updateData.verified = false;
      //     updateData.isPremium = false;
      //     updateData.reference = ``;
      //   }
        
      //   if (!link.emails.includes(mail)) {
      //     link.emails.push(mail)
      //     console.log("links", link);
      //     await User.findOneAndUpdate({ _id: userId, "links.apk": apk.title }, { $inc: { totalPrice: user.pricePerDownlaod, downlaods: 1, "links.$.downloads": 1 }, $push: { "links.$.emails": mail } });

      //     console.log(`updateData`, updateData)

      //     if(user.inviteId){
      //       let user2 =  await User.findOne({ _id: user.inviteId}, {pricePerDownlaod: true})
      //       await User.findOneAndUpdate({ _id: user.inviteId}, { $inc: { totalPrice: user2.pricePerDownlaod*0.3}})
      //     }
          
      //   }

      // }

      let result = await Apk.findOneAndUpdate({_id: apkId}, updateData, {new: true});

      res.status(200).json({
        hasError: false,
        link: file
      });
    } else {
      res.status(404).json({
        hasError: true,
        message: `Apk Not Found`
      });
    }
  }
  catch (err) {
    console.log(err)
    res.status(500).json({
      hasError: true,
      message: `Internal Server Error Occured`
    })
  }

});

exports.getcategory = catchAsync(async (req, res) => {
  const category = req.params.category;
  console.log({ category });
  const data = await Category.findOne({ category });
  console.log({ data });
  res.status(200).json({ data });
});

exports.addComment = async (req, res) => {
  
  try {

    const [{ text, rating }, { apkId }] = [req.body, req.params,];
    let date = new Date();


    let param 
    if(rating == 1){
      param = `Rating_count.one`
    } else if(rating == 2){
      param = `Rating_count.two`
    } else if(rating == 3){
      param = `Rating_count.three`
    } else if(rating == 4){
      param = `Rating_count.four`
    } else if(rating == 5){
      param = `Rating_count.five`
    } else if(rating < 1 || rating > 5 || text == null ) {

      res.status(400).json({

        hasError: true,
        message: "Invalid 'Rating' value"

      })

    }
    if( text == null ) {

      res.status(400).json({

        hasError: true,
        message: "Invalid 'text' value"

      })

    }
    if( !isValidObjectId(apkId) ){

      res.status(400).json({

        hasError: true,
        message: "Invalid 'apkId' value"

      })

    }

    let review = {
      comment: {
        text: req.body.text,
        user: req.user.id,
        time: date
      },
      reply: {},
      rating
    }

    const apk = await Apk.findOneAndUpdate({ _id: apkId }, { $push: { reviews: review }, $inc: { [param]: 1 } }, { new: true }).lean().exec();

    res.status(200).json({
      
      hasError: false,
      message: "Comment Added Successfully with the given rating"
    });

    
  console.log(`apk.Rating_count`, apk.Rating_count)

  let total_reviews = apk.Rating_count.one + apk.Rating_count.two + apk.Rating_count.three + apk.Rating_count.four + apk.Rating_count.five

  console.log(`total_reviews`, total_reviews);

  let average_rating = 0;

  let total_rating = apk.Rating_count.one + apk.Rating_count.two*2 + apk.Rating_count.three*3 + apk.Rating_count.four*4 + apk.Rating_count.five*5 

  console.log(`total_rating`, total_rating);

  average_rating = total_rating / total_reviews;
  console.log(`average_rating`, average_rating)
  average_rating = Math.round((average_rating + Number.EPSILON) * 100) / 100
  console.log(`average_rating`, average_rating)

  const result = Apk.findOneAndUpdate({_id: apkId}, { average_rating: average_rating ? average_rating: 0  }).lean().exec();


  }
  catch (err) {
    console.log(err);
    res.status(500).json({
      hasError: true,
      err
    })
  }
}

exports.getReviews = async( req, res) => {

  try{

    const [{ apkId }, {search, offset, page}] = [req.params, req.body];

    let filters = {}

    const [ startRecord, noOfRecords ] = [ parseInt(page) <= 1 ? 0 : parseInt((parseInt(page) - 1) * parseInt(offset)), parseInt(offset) <= 0 ? 1 : parseInt(offset)];


    let pipeline = [
      {
        '$match': {
          '_id': mongoose.Types.ObjectId(apkId)
        }
      }, {
        '$unwind': {
          'path': '$reviews'
        }
      }, {
        '$facet': {
          'possibleDataDrawings': [
            {
              '$count': 'total'
            }, {
              '$project': {
                'possibleDataDrawings': {
                  '$ceil': {
                    '$divide': [
                      '$total', noOfRecords
                    ]
                  }
                }
              }
            }
          ], 
          'reviews': [
            {
              '$skip': startRecord
            }, {
              '$limit': noOfRecords
            }, {
              '$project': {
                'reviews': 1, 
                '_id': 1
              }
            }
          ]
        }
      }, {
        '$unwind': {
          'path': '$reviews'
        }
      }, {
        '$project': {
          'possibleDataDrawings': 1, 
          'reviews': '$reviews.reviews', 
          '_id': '$reviews._id'
        }
      }, {
        '$lookup': {
          'from': 'users', 
          'localField': 'reviews.comment.user', 
          'foreignField': '_id', 
          'as': 'User'
        }
      }, {
        '$lookup': {
          'from': 'users', 
          'localField': 'reviews.reply.user', 
          'foreignField': '_id', 
          'as': 'User1'
        }
      }, {
        '$addFields': {
          'reviews.comment.user': {
            '$arrayElemAt': [
              '$User', 0
            ]
          }, 
          'reviews.reply.user': {
            '$arrayElemAt': [
              '$User', 0
            ]
          }
        }
      }, {
        '$project': {
          'possibleDataDrawings': 1, 
          'reviews': 1
        }
      }, {
        '$project': {
          'possibleDataDrawings': 1, 
          'reviews.comment.text': 1, 
          'reviews.comment.time': 1, 
          'reviews.comment.user.name': 1, 
          'reviews.comment.user.dp': 1, 
          'reviews.reply.text': 1, 
          'reviews.reply.time': 1, 
          'reviews.reply.user.name': 1, 
          'reviews.reply.user.dp': 1, 
          'reviews.rating': 1
        }
      }, {
        '$project': {
          'possibleDataDrawings': {
            '$arrayElemAt': [
              '$possibleDataDrawings', 0
            ]
          }, 
          'reviews': 1
        }
      }, {
        '$project': {
          'possibleDataDrawings': '$possibleDataDrawings.possibleDataDrawings', 
          'reviews': 1
        }
      }, {
        '$group': {
          '_id': '$_id', 
          'reviews': {
            '$push': '$reviews'
          }, 
          'possibleDataDrawings': {
            '$first': '$possibleDataDrawings'
          }
        }
      }
    ]
    
    let possibleDataDrawings = {};
    let reviews = {};

    // creating object to store new franchise 
    let result =(await Apk.aggregate(pipeline).exec())[0];

    if( result ){
      possibleDataDrawings = result.possibleDataDrawings;
      reviews = result.reviews;
    }

    if(!possibleDataDrawings){

      possibleDataDrawings = 1

    }

    // returning saved response to it's caller 

    res.status(200).json({
      hasError: false,
      possibleDataDrawings ,
      reviews
    })
      

  } catch(err){

      console.log("error", err)

      res.status(500).json({

        hasError: true,
        message: "Internal server error occured"

      })

  }

}

exports.replyToComment = async (req, res) => {
  try {
    const [{ user, text }, { title, reviewId }] = [req.body, req.params];

    let date = new Date();
    //  console.log(req.body);
    let reply = {
      text,
      user: req.user.id,
      time: date
    }
    let titl = title.replace("_", " ");

    const result = await Apk.findOneAndUpdate({ title: titl, "reviews._id": reviewId }, { $set: { "reviews.$.reply": reply } }, { new: true }).lean().exec();
    //  const result = await Apk.findOne({title : titl , "reviews._id" : reviewId})// , {$set : {"reviews.$.reply" : reply}} , {new : true}).lean().exec();


    res.status(204).json({
      hasError: false
    })

  }
  catch (err) {
    console.log(err);
    res.status(500).json({
      hasError: true,
      err
    })
  }
}

exports.sendDownloadLink = async (req, res) => {
  
  try {


    const [ { username, email, userId }, { apkId }, { authorization } ] = [ req.body, req.params, req.headers ];
 
    var user = { email: email, name: username }

    if(authorization != `null`){
   
       const decoded = await promisify(jwt.verify)(authorization, process.env.JWT_SECRET);
   
       user = await User.findOne({_id: decoded.id});
     
     }
    
     let expireDate = moment().add(10, 'minutes').format('MMMM Do YYYY, h:mm:ss a')
   
   
   
     let downloadUrl;



    if (userId) {
      let expireToken = jwt.sign(
        {
          expireDate,
          userId,
          mail: user.email
        },
        // this jwt secret should  be greater then 32 alphabets
        process.env.JWT_SECRET,
        {
          // this can be 90d ,30h,50m ,20s
          expiresIn: process.env.JWT_EXPIRE_IN,
        }
      );
      downloadUrl = `https://qubstore.com/productdetail.html?apkId=${apkId}&token=${expireToken}`
    }
    else {
      let expireToken = jwt.sign(
        {
          expireDate
        },
        // this jwt secret should  be greater then 32 alphabets
        process.env.JWT_SECRET,
        {
          // this can be 90d ,30h,50m ,20s
          expiresIn: process.env.JWT_EXPIRE_IN,
        }
      );
      downloadUrl = `https://qubstore.com/productdetail.html?apkId=${apkId}&token=${expireToken}`
    }

    const apk = await Apk.findOne({ _id: apkId });
  
    await new Email(user, downloadUrl, apk.title).sendDownloadLink();

  
    // send response to user
    res.status(200).json({
      status: "success",
      message: "Download Link sent to email!",
    });
  
  }
  catch (err) {

    console.log(err)
    
    res.status(500).json({
      hasError: true,
      message: "We Can Not send Download Link To Your Mail"
    })
  }

}

exports.products = async (req, res) => {
  
  try{
  const { name } = req.user;
  let products;

  console.log(`name`, name);
    
  products = await Apk.find({ creator: name }).lean();

  res.status(200).json({

    products

  })

  } catch(err){
    res.status(500).json({
      message: "internal server error occured"
    })
  }
}

exports.saveReference = async(req, res) => {

  const {_id, offer } = req.body;

  console.log(_id, offer)

  let amount;
  let downloads;

  if(offer == `1` && _id){
  
    amount = 10000;
    downloads = 10000;
  
  } else if( offer == `2` && _id){
  
    amount = 20000;
    downloads = 20000;
  
  } else if( offer == `3` && _id){
    
    amount = 30000;
    downloads = 30000;

  } else {
  
    return res.status(400).json({
      hasError: true,
      message: 'invalid offer'
  
    });
  
  }

  let options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: '/transaction/initialize',
    method: 'POST',
    headers: {
      Authorization: 'Bearer sk_test_fe1a7509d6c840ae101e6bf1c7059c9a22c9ec9f',
      'Content-Type': 'application/json'
    }
  }
  
  const createReq = https.request(options, respones => {
    let data = ''
    respones.on('data', (chunk) => {
      data += chunk
    });

    respones.on('end', async () => {
      
      data = JSON.parse(data);
      
      if(data.status){
        
        const result = await Apk.findOneAndUpdate({_id: _id}, {"$set":{reference: data.data.reference, isPremium: true , remaining: downloads}}, {new: true}).lean();
        
        if(!result){

          console.log(`Cannot find Apk while creating reference`);
          return res.status(404).json({

            hasError: true,
            message: `Cannot find Apk while creating reference`

          });

        }

        return res.status(200).json({

          hasError: false,
          data

        })
        
      }
      else{
      
      
        return res.status(500).json({

          hasError: true,
          message: ` Error from paystack while creating reference`

        })
  
      }
  
    });
  
  
  }).on('error', error => {
  
    console.error(`error`,error)
  
    return res.status(500).json({

      hasError: true,
      message: 'AN error occured while creating reference'

    });
  
  });
  
  const params = JSON.stringify({
      "email": req.user.email,
      "amount": amount
    });

  createReq.write(params);
  createReq.end();
  
}

exports.verifyReference = async(req, res) => {

  const {_id} = req.body;

  console.log(`_id`,_id)

  let apk = await Apk.findOne({_id: _id, isPremium: true });

  if( !apk || !apk.reference){

    return res.status(401).json({

      hasError: true,
      message: `this apk is mnissing Reference`

    });

  }

  // const options = {
  //   hostname: 'api.paystack.co',
  //   port: 443,
  //   path: `/transaction/verify/${apk.reference}`,
  //   method: 'GET',
  //   headers: {
  //     Authorization: 'Bearer sk_test_fe1a7509d6c840ae101e6bf1c7059c9a22c9ec9f'
  //   }
  // }


  axios.get(`https://api.paystack.co/transaction/verify/${apk.reference}`,
  {headers: {
    Authorization: 'Bearer sk_test_fe1a7509d6c840ae101e6bf1c7059c9a22c9ec9f'
  }})
  .then(async response => {

    let data = '';
    
    console.log(response.data);

    
    if(response.data.data.status == `success`){

        const result = await Apk.findOneAndUpdate({_id: _id, isPremium: true}, {"$set":{ reference: apk.reference, verified: true}}, {new: true} ).lean().exec();


        if(!result){

          return res.status(401).json({

            hasError: true,
            message: `error while verifying the apk`,

          })

        }

        return res.status(200).json({

          hasError: false,
          message: `transection verified for this apk`,
          data: response.data
  
        });

      }

      return res.status(400).json({

        hasError: false,
        message: `transection verified for this apk`,
        data: response.data

      });



    
  })
  .catch(err => {
    
    console.log(err)
      res.status(500).json({

        hasError: true,
        error: err

      })
  })


  try{

  // console.log(verifyReq);
  }
  catch( err){
    console.log(err);
  }

}

exports.getCategoryApks = async(req, res) => {

  try{

    let {category, type, offset, page, search, subCategory} = req.body;

    let filters = {actions: "approved"}

    if(category){
      filters[`category`] = category
      if(subCategory){
        filters[`subCategory`] = subCategory
      }
    } else if(type){
      filters[type] = true
    }
  
    if(search){

      filters[`title`] = new RegExp(search.trim(), `i`);
    
    }
    
    const [ startRecord, noOfRecords ] = [ parseInt(page) <= 1 ? 0 : parseInt((parseInt(page) - 1) * parseInt(offset)), parseInt(offset) <= 0 ? 1 : parseInt(offset)];

    // crteating projection object 
    let pipeline = [
      {

        '$match': filters
      
      }, {

        $facet : {
          possibleDataDrawings: [
            {
              $count: `total`
            },
            {
              $project: {
                possibleDataDrawings: {
                  $ceil: {
                    $divide: [`$total`, noOfRecords]
                  }
                }
              }
            }
          ],
          apks: [
            
            {
      
              '$skip': startRecord
            
            }, {
              
              '$limit': noOfRecords
              
            }, {

              '$project': {
           
                'title': 1,
                'image': 1,
                'downloads': 1,
                'average_rating': 1,
                '_id': 1
           
             }
           
           }
          ]
        }
      }, {
        $project: {
          possibleDataDrawings: {
            $arrayElemAt: [`$possibleDataDrawings`, 0]
          },
          apks: 1
        }
      }, {
        $project: {
          possibleDataDrawings: `$possibleDataDrawings.possibleDataDrawings`,
          apks: 1
        }
      }
      ]

    // querying database for all franchises
    let {possibleDataDrawings ,apks}  = (await Apk.aggregate(pipeline).exec())[0];

     if( !possibleDataDrawings ){

      possibleDataDrawings = 0
     
    }

    return res.status(200).json({

      hasError: false,
      apks: apks,
      possibleDataDrawings

    })

  
  } catch(err){

    console.log("error while getting specific categories apks", err)
    res.status(500).json({

      hasError: true,
      message: "INternal server error occured"

    })

  }
  
}

exports.getTypesApks = async(req, res) => {

  try{

    let {type, offset, page, search} = req.body;

    let filters = {}

    if(type){
      filters = {[types]: true}
    }
  
    if(search){

      filters[`title`] = new RegExp(search.trim(), `i`);
    
    }
    
    const [ startRecord, noOfRecords ] = [ parseInt(page) <= 1 ? 0 : parseInt((parseInt(page) - 1) * parseInt(offset)), parseInt(offset) <= 0 ? 1 : parseInt(offset)];

    // crteating projection object 
    let pipeline = [
      {

        '$match': filters
      
      }, {

        $facet : {
          possibleDataDrawings: [
            {
              $count: `total`
            },
            {
              $project: {
                possibleDataDrawings: {
                  $ceil: {
                    $divide: [`$total`, noOfRecords]
                  }
                }
              }
            }
          ],
          apks: [
            
            {
      
              '$skip': startRecord
            
            }, {
              
              '$limit': noOfRecords
              
            }, {

              '$project': {
           
               'title': 1,
               'image': 1,
               'downloads': 1,
               '_id': 1
           
             }
           
           }
          ]
        }
      }, {
        $project: {
          possibleDataDrawings: {
            $arrayElemAt: [`$possibleDataDrawings`, 0]
          },
          apks: 1
        }
      }, {
        $project: {
          possibleDataDrawings: `$possibleDataDrawings.possibleDataDrawings`,
          apks: 1
        }
      }
      ]
    

    // querying database for all franchises
    let {possibleDataDrawings ,apks}  = (await Apk.aggregate(pipeline).exec())[0];

     if( !possibleDataDrawings ){

      possibleDataDrawings = 0
     
    }
    return res.status(200).json({

      hasError: false,
      message: "Requested operation successful",
      apks: apks,
      possibleDataDrawings: possibleDataDrawings

    })

  } catch(err){

    console.log("error", err);
    return res.status(500).json({

      hasError: true,
      message: `An internal server error occured`

    })

  }

}

exports.getCategory = async(req, res) => {

  try{

    let { category, limit } = req.body;

    if(!limit){
      limit = 6
    }

    let pipeline = [
      {
        '$match': {
          'category': category
        }
      }, {
        '$unwind': {
          'path': '$subCategory'
        }
      }, {
        '$project': {
          'subCategory': 1
        }
      }, {
        '$limit': limit
      }, {
        '$group': {
          '_id': '$_id', 
          'subCategory': {
            '$push': '$subCategory'
          }
        }
      }
    ]

    const result = (await Category.aggregate(pipeline).exec())[0];

    return res.status(200).json({

      hasError: false,
      message: `requested operation successfull`,
      category: result.subCategory

    })

  } catch(err){

    console.log("Error", err);
    return res.status(500).json({

      hasError: true,
      message: `An Internal server error occured`

    })

  }

}

exports.getApksPaginated = async(req, res) => {

  try{

    let { pageNumber, offset } = req.body;


    const result = await Apk.find({},{image: true, title: true, downloads: true}).limit(24).exec();

    return res.status(200).json({

      hasError: true,
      apks: result

    })


  } catch(err){
    
    console.log("error", err);
    res.status(500).json({

      hasError: true,
      message: "an internal server error ocured"

    })

  }

}

exports.getApks = async (req,res) => {

  try{

    let {pageSize, pageNumber, searchFilters } = req.body;

    
    let filters = {};

    console.log(`searchFilters`, searchFilters)


    // looping through all filters to modify them according
    // to the query syntax requirements
    for (const filter in searchFilters) {

      switch (filter) {

        case `title`: {

          console.log(`filter`)

          filters[`title`] = new RegExp(searchFilters[filter].trim(), `i`);

          // deleting the 'firstName' key
          delete searchFilters[filter];

          break;

        }

        case `creator`: {

          filters[`creator`] = new RegExp(searchFilters[filter].trim(), `i`);

          // deleting the 'firstName' key
          delete searchFilters[filter];

          break;

        }

        case `developer`: {

          filters[`developer`] = new RegExp(searchFilters[filter].trim(), `i`);

          // deleting the 'firstName' key
          delete searchFilters[filter];

          break;

        }

        case `category`: {

          filters[`category`] = new RegExp(searchFilters[filter].trim(), `i`);

          // deleting the 'firstName' key
          delete searchFilters[filter];

          break;

        }

        case `type`: {

          filters[searchFilters[filter]] = true;

          // deleting the 'firstName' key
          delete searchFilters[filter];

          break;

        }

        default: {

          // skipping the current iteration
          continue;

        }

      }

    }    
    

    console.log(`filters`, filters)

    const [ startRecord, noOfRecords ] = [ parseInt(pageNumber) <= 1 ? 0 : parseInt((parseInt(pageNumber) - 1) * parseInt(pageSize)), parseInt(pageSize) <= 0 ? 1 : parseInt(pageSize)];

    // crteating projection object 
    let pipeline = [
      {

        '$match': filters
      
      }, 
      {

        $facet : {
          possibleDataDrawings: [
            {
              $count: `total`
            },
            {
              $project: {
                possibleDataDrawings: {
                  $ceil: {
                    $divide: [`$total`, noOfRecords]
                  }
                }
              }
            }
          ],
          totalApks: [
            {
              '$count': 'total'
            }
          ],
          apks: [
            
            {
      
              '$skip': startRecord
            
            }, {
              
              '$limit': noOfRecords
              
            }, {

              '$project': {
           
                'title': 1,
                'image': 1,
                'downloads': 1,
                'average_rating': 1,
                '_id': 1,
                'actions': 1,
                'category':1
           
             }
           
           }
          ]
        }
      }, {
        $project: {
          possibleDataDrawings: {
            $arrayElemAt: [`$possibleDataDrawings`, 0]
          },
          totalApks: {
            '$arrayElemAt': ['$totalApks', 0]
          },
          apks: 1,

        }
      }, {
        $project: {
          possibleDataDrawings: `$possibleDataDrawings.possibleDataDrawings`,
          totalApks: `$totalApks.total`,
          apks: 1
        }
      }
      ]

    // querying database for all franchises
    let {possibleDataDrawings, totalApks ,apks}  = (await Apk.aggregate(pipeline).collation({ locale: `en`, strength: 2 }).exec())[0];

     if( !totalApks ){

      return res.status(200).json({
        hasError: false,
        message: `WARNING: No health quotes found in the database against requested parameters.`,
        totalRecords: totalApks,
        currentPageRecords: apks.length,
        totalPages: 0,
        data: apks
      });
     
    }

    return res.status(200).json({
      hasError: false,
      message: `SUCCESS: Requested data fetched successfully.`,
      totalRecords: totalApks,
      currentPageRecords: apks.length,
      totalPages: possibleDataDrawings,
      data: apks
    });

  
  } catch(err){

    console.log("error while getting specific categories apks", err)
    res.status(500).json({

      hasError: true,
      message: "INternal server error occured"

    })

  }

}

exports.temporaryDownload = async(req, res) => {

  try{

    const { apkId } = req.params;

    const { file, downloads, remaining } = await Apk.findOne({ _id: apkId });

    if (fs.existsSync(path.join(__dirname, `../public/apk/${file}`))) {
     
      
      res.status(200).json({
        hasError: false,
        link: file
      });
    } else {
      res.status(404).json({
        hasError: true,
        message: `Apk Not Found`
      });
    }

  } catch(error){

    console.log(err)
    res.status(500).json({
      hasError: true,
      message: `Internal Server Error Occured`
    })

  }

}

/*
*/