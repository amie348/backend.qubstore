const fileDownloaderModel = require(`../models/fileDownloaders.model`);
const path = require("path");
const fs = require("fs");

const downloadRhapsodyDoc = async( req,  res ) => {

    try{

        const {name, email, language} = req.body;

        console.log(fs.existsSync(path.join(__dirname, `../public/files/${language}.pdf`)))

        if (!fs.existsSync(path.join(__dirname, `../public/files/${language}.pdf`)) ) {
     
           return  res.status(404).json({
                hasError: true,
                message: `Doc Not Found`
              });
           
            
          } 


          const newFileDownloader  = new fileDownloaderModel({
            name, email, language
          });


          const result = await newFileDownloader.save()

          if(!result){

            return res.status(400).json({

                hasError: true,
                message: "error occured while saving user info",

            })

          }

           return  res.status(200).json({
              hasError: false,
              link: `https://admin.qubstore.com/files/${language}.pdf`
            });



    } catch(error){

        console.log("An error occured", error);

        return res.status(500).json({

            hasErro: true,
            message: "internal server error occured"

        })


    }

}



module.exports = {

    downloadRhapsodyDoc

}