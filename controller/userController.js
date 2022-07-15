const catchAsync = require("../utils/catchAsync");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const Apk = require(`../models/apkModel`)


exports.getAllUsers = catchAsync(async (req, res) => {
  
  
  const users = await User.find({ active: true });
  res.status(200).json({ users });


});

exports.getUsers = async (req,res) => {

  try{

    let {pageSize, pageNumber, searchFilters } = req.body;

    
    let filters = {};

    console.log(`searchFilters`, searchFilters)


    // looping through all filters to modify them according
    // to the query syntax requirements
    for (const filter in searchFilters) {

      switch (filter) {

        case `name`: {

          console.log(`filter`)

          filters[`name`] = new RegExp(searchFilters[filter].trim(), `i`);

          // deleting the 'firstName' key
          delete searchFilters[filter];

          break;

        }

        case `email`: {

          filters[`email`] = new RegExp(searchFilters[filter].trim(), `i`);

          // deleting the 'firstName' key
          delete searchFilters[filter];

          break;

        }

        case `role`: {

          filters[`role`] = new RegExp(searchFilters[filter].trim(), `i`);

          // deleting the 'firstName' key
          delete searchFilters[filter];

          break;

        }


        case `active`: {

          filters[`active`] = searchFilters[filter] === `true`;

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
          totalUsers: [
            {
              '$count': 'total'
            }
          ],
          users: [
            
            {
      
              '$skip': startRecord
            
            }, {
              
              '$limit': noOfRecords
              
            }, {

              '$project': {
           
                'name': 1,
                'email': 1,
                'role': 1,
                'active': 1,
                '_id': 1,
           
             }
           
           }
          ]
        }
      }, {
        $project: {
          possibleDataDrawings: {
            $arrayElemAt: [`$possibleDataDrawings`, 0]
          },
          totalUsers: {
            '$arrayElemAt': ['$totalUsers', 0]
          },
          users: 1,

        }
      }, {
        $project: {
          possibleDataDrawings: `$possibleDataDrawings.possibleDataDrawings`,
          totalUsers: `$totalUsers.total`,
          users: 1
        }
      }
      ]

    // querying database for all franchises
    let {possibleDataDrawings, totalUsers ,users}  = (await User.aggregate(pipeline).collation({ locale: `en`, strength: 2 }).exec())[0];

     if( !totalUsers ){

      return res.status(200).json({
        hasError: false,
        message: `No Users found in the database against requested parameters.`,
        totalRecords: totalUsers,
        currentPageRecords: users.length,
        totalPages: 0,
        data: users
      });
     
    }

    return res.status(200).json({
      hasError: false,
      message: `SUCCESS: Requested data fetched successfully.`,
      totalRecords: totalUsers,
      currentPageRecords: users.length,
      totalPages: possibleDataDrawings,
      data: users
    });

  
  } catch(err){

    console.log("error while getting specific categories apks", err)
    res.status(500).json({

      hasError: true,
      message: "INternal server error occured"

    })

  }

}

exports.deleteUser = catchAsync(async (req, res, next) => {
  const doc = await User.findOneAndDelete(
    { email: req.params.email });
  if (!doc) {
    return next(new AppError("NO document found with that name", 404));
  }
  res.status(204).json({
    message: "success",
  });
});

exports.deleteUserById = async (req, res) => {

  try{

    const {userId} =  req.params;
    

    let result = await User.findByIdAndDelete({_id: userId});
  
    console.log(`result`, result);

    if(!result){
      
      return res.status(400).json({
      
        hasError: true,
        message: "user deletion failed"
  
      });

    }

    return res.status(200).json({
      
      hasError: false,
      message: "user deleted successfully"

    });
  
  }catch(err){

    return res.status(500).json({
      hasError: true,
      message: "Internal server error occured"
    });

  }  

}

exports.getMe = catchAsync(async (req, res, next) => {
  
  const me = await User.findById(req.user.id).populate({
    path: "admin",
    select: "-users  -_id -passwordChangedAt -__v",
  });
  if (!me) {
    return next(
      new AppError(
        "This route is not for changing password use updateMyPassword",
        400
      )
    );
  }

  res.status(200).json({
    data: me,
  });
});

const filter = (obj, ...fields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (!fields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  // console.log(req.file);
  // console.log(req.body);
  // create error if user posts password
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for changing password use updateMyPassword",
        400
      )
    );
  }
  // filter out  the unwanted fields name that are not allowed to updated
  const filterObj = filter(req.body, "name", "email");
  if (req.file) {
    filterObj.photo = req.file.filename;
  }
  // update the user data
  let updatedUser = await User.findByIdAndUpdate(req.user.id, filterObj, {
    new: true,
    runValidators: true,
  });
  if (!updatedUser) {
    updatedUser = await User.findByIdAndUpdate(req.user.id, filterObj, {
      new: true,
      runValidators: true,
    });
  }
  res.status(200).json({
    status: "success",
    user: updatedUser,
  });
});

exports.update = catchAsync(async (req, res, next) => {
  
  try{

    // const { dp, email, dob } = req.body;
    
    // const filterObj = {}
    
    // if( dp ){
    //   filterObj[`dp`] = dp 
    //   console.log(`dp`, dp)
    // } else if( email ){
    //   filterObj[`email`] = email
    // } else if(dob){
    //   filterObj[`dob`] = dob
    // }


    let updatedUser = await User.findByIdAndUpdate(req.user.id, req.body, { new: true, runValidators: true });
  
    console.log(updatedUser)

    if(!updatedUser){
      
      return res.status(400).json({
      
        hasError: true,
        message: "user updation failed"
  
      });

    }

    return res.status(200).json({
      
      hasError: false,
      message: "user updated successfully"

    });
  
  }catch(err){

    return res.status(500).json({
      hasError: true,
      message: "Internal server error occured"
    });

  }
});

exports.updateUser = async(req, res) => {

  try{

    const {userId} = req.params

    console.log(typeof userId, typeof req.user.id)

    let updatedUser = await User.findById(userId);
  
    console.log(updatedUser)

    if(!updatedUser){
      
      return res.status(400).json({
      
        hasError: true,
        message: "user updation failed"
  
      });

    }

    return res.status(200).json({
      
      hasError: false,
      message: "user updated successfully"

    });
  
  }catch(err){

    return res.status(500).json({
      hasError: true,
      message: "Internal server error occured"
    });

  }

}

exports.updateStatus  =  async (req, res) => {

  try{

    const [{ active }, {userId}] = [req.body, req.params];
    

    console.log({ active }, {userId})

    let updatedUser = await User.findOneAndUpdate({_id: userId}, {active : active === "true"}, { new: true });
  
    console.log(updatedUser)

    if(!updatedUser){
      
      return res.status(400).json({
      
        hasError: true,
        message: "user updation failed"
  
      });

    }

    return res.status(200).json({
      
      hasError: false,
      message: "user updated successfully"

    });
  
  }catch(err){

    return res.status(500).json({
      hasError: true,
      message: "Internal server error occured"
    });

  }

}


exports.getLinks = async (req, res) => {
  
  try {
    // let { name } = req.user;

    let user = await User.findOne({ _id: req.user.id });
   
    if (!user) {
      return res.status(404).json({
        hasError: true,
        message: `User Not Found`
      })
    }
   
    let linkedApk = user.links.map(link => {
      return link.apk
    })
   
    let Apks = await Apk.find({verified:true}, { title: true, _id: true })
   
    console.log(`Apks`, Apks)

    apks = Apks.map(apk => {
      return apk.title
    });
    
    user.links = user.links.filter(link=> apks.includes(link.apk));
   
    apks = Apks.filter(apk=> !linkedApk.includes(apk.title))

    res.status(200).json({
      hasError: false,
      apks,
      user
    })

  } catch (err) {
    console.log(`--- error message ---`, err.message)
    res.status(500).json({
      hasError: true,
      message: `Internal server occured`
    })
  }

}

exports.createLink = async (req, res) => {

  try {

    let { requiredApk } = req.body
    let result = await Apk.find({ title: { $in: requiredApk } }, { title: true, _id: true })
    let apks = result.map(apk => {
      return {title: apk.title, _id: apk._id}}
      )
    
    if (!result.length) {
      return res.status(200).json({
        hasError: true,
        message: `Apks Not Found`
      })
    }
    
    let user = await User.findOne({ _id: req.user.id })
    
    if (!user) {
      return res.status(200).json({
        hasError: true,
        message: `User Not Found`
      })
    }

    let links = apks.map(apk => {
      
      return { link: `https://qubstore.com/productdetail.html?apkId=${apk._id}&userId=${user._id}`, apk: apk.title }
    })

    // console.log(`links`, links)

    user = await User.findOneAndUpdate({ _id: user._id }, { $push: { links: { $each: links } } }, { new: true }).lean()

    if (!user) {
      return res.status(200).json({
        hasError: true,
        message: `User Not Found`
      })
    }

    res.status(200).json({
      hasError: false,
      message: `Links Created`,
      user
    })


  } catch (err) {
    console.log(`error message`, err.message)
    res.status(500).json({
      hasError: true,
      message: `internal server error occured`
    })
  }

}

exports.updatePrice = async (req, res) => {
  try {
    let { name, price } = req.body
    let result = await User.findOneAndUpdate({ name: name }, { $set: { pricePerDownlaod: price } }, { new: true }).lean()
    if (!result) {
      return res.status(404).json({
        hasEror: true,
        message: `User Not Found`
      })
    }
    res.status(200).json({
      hasError: false,
      user: result
    })
  } catch (err) {
    res.status(500).json({
      hasError: true,
      message: `Internal server error occured`
    })
  }
}

exports.deleteLink = async (req, res) => {
  try {
    let { apk } = req.body

    let result = await User.updateMany({ "links.apk": apk }, { $pull: { links: { apk: apk } } })
    console.log(`result`, result)
    res.status(200).json({
      hasError: true,
      message: `success`
    })
  }
  catch (err) {
    console.log(`error message`, err.message)
    res.status(500).json({
      hasError: true,
      message: `Internal server error occured`
    })
  }
}

exports.addAccount = async( req, res ) => {

  try{

    const [ { id } , { account }] = [req.user, req.body];


    if(!account || typeof account !="string"){

      console.log(`Account number is invalid`);
      return res.status(400).json({

        hasError: true,
        message: `Account number is invalid`

      });

    } else if( account.length != 14){

      console.log(`Account number must be 14 characters`);
      return res.status(400).json({

        hasError: true,
        message: `Account number must be 14 characters`

      });

    }

    console.log(`id`, id);
    const result = await User.findOneAndUpdate({_id: id}, {account}).lean().exec()

    if(!result){

      console.log(`user not found`)
      return res.status(404).json({

        hasError: true,
        message: `error while updating Account Number`
  

      });

    }

    return res.status(200).json({

      hasError: false,
      message: `successully updated the account number`

    });


  } catch(err){

    console.log(err);
    res.status(500).json({

      hasError: true,
      message: `Internal server error occured`

    });

  }

}