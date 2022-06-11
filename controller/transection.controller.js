// importing required models
const Transection = require(`../models/trancsection.model`);
const User = require(`../models/userModel`);
const mongoose = require(`mongoose`);



// this controller takes transection data from the incoming request save it in the
// database and returns the response
const createTransection = async (req, res) => {

  try{
    
    // fetch data from request body
    let [ { id, account},{ amount } ]= [ req.user, req.body];
  
    amount = parseInt(amount)

    if(!account){

      return res.status(200).json({

        account: false

      });

    }

    // validating request data
    if( !amount || !(typeof amount == "number") ){

      return res.status(400).json({

        hasError: true,
        message: `Invalid field ( amount )`

      });

    } 

    const newTransection = new Transection({
      _id: new mongoose.Types.ObjectId,
      to:id,
      // from, 
      account, 
      amount });

    const result = await newTransection.save();


    if(!result){

      return res.status(401).json({
        
        hasError: true,
        message: `failed while creating transection`

      });

    }

    console.log(`id`, id, amount)
    const user = await User.findOneAndUpdate({_id: id}, {"$inc": {pending: amount, totalPrice: -amount}}, {new: true}).lean().exec();
    console.log(`user`, user)

    return res.status(201).json({

      hasError: false,
      message: `your request created successfull`

    })


  } catch(err){

    console.log(`error`, err);

    res.status(500).json({

      hasError: true,
      message: `INternal server error occured`

    })

  }

}


const getSuccessedTransections = async (req, res) => {

  try{

    const result = await Transection.find({status: true}).populate("to", `name account`).lean().exec();

    return res.status(200).json({

      hasError: false,
      data: result

    });


  } catch(err){

    onsole.log(`error`, err);

    res.status(201).json({

      hasError: true,
      message: `INternal server error occured`

    })

  }

}


const getPendingTransections =  async (req, res) => {

  try{

    const result = await Transection.find({status: false}).populate(`to`, `name account`).lean().exec();

    return res.status(200).json({

      hasError: false,
      data: result

    });


  } catch(err){

    console.log(`error`, err);

    res.status(201).json({

      hasError: true,
      message: `INternal server error occured`

    })

  }

}

const updateTransection = async (req, res) => {

  try{
  
    const [ { id }, { name } ] = [ req.body, req.user ];
    

    const result = await Transection.findOneAndUpdate({_id: id, status: false}, {"$set": {status: true, from: name}}, {new: true}).lean().exec()



    if(!result){

      return res.status(404).json({

        hasError: true,
        message: "transection not found"

      });


    } 
    

    const user = await User.findOneAndUpdate({_id: result.to} , {"$inc": {pending: -result.amount}}, {new: true}).lean().exec();


    return res.status(200).json({

      hasError: false,
      message: "transection successfull"

    });


  } catch(err){

      console.log(`error`, err);

      res.status(201).json({

        hasError: true,
        message: `INternal server error occured`

      })

  }

}



// eexporting controllers as modules
module.exports = {

  createTransection,
  getSuccessedTransections,
  getPendingTransections,
  updateTransection

}