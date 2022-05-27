const express = require("express");

const multer = require("multer");
const Router = express.Router();
const apkController = require("../controller/apkController");
const { protect, restrictTo } = require("../controller/authController");
const sliderController = require("../controller/sliderController");
const upload = multer();
Router.get("/updateVisitors", sliderController.updateVisitors);

Router.post("/category-vise-apks", apkController.getCategoryApks);
Router.post("/type-vise-apks", apkController.getTypesApks);
Router.post("/category", apkController.getCategory);
Router.post("/paginated", apkController.getApksPaginated);


Router.get("/activesliders", sliderController.getAllActive);
Router.get("/approved", apkController.allApprovedApk);
Router.get("/trend", apkController.trendingApks);
Router.get("/papular", apkController.papularApks);
Router.get("/getAllCate", apkController.getAllCate);
Router.post("/download/:apkId", apkController.getDownload);
Router.get("/getApk/:apkId", apkController.getApk);
Router.get("/getcategory/:category", apkController.getcategory);
Router.patch("/updateStatics/:image", apkController.updateStatics);
// here cate means subCate
Router.get("/samecate/:cate", apkController.getSameCateApps);
// protected routes
Router.patch("/reply/:title/:reviewId", protect,apkController.replyToComment)
Router.patch("/comment/:apkId", protect, apkController.addComment);
Router.post("/sendDownloadLink/:apkId", apkController.sendDownloadLink)
// Router.use(authController.protect);
Router.get("/oneapk/:title", protect, apkController.getOneApk);
Router.get("/get/apks", protect, apkController.products);
Router.post("/get/apks",protect, apkController.getApks);
Router.post("/addApk", protect, apkController.uploadImage, apkController.addApk);
Router.post("/get-reviews/:apkId", apkController.getReviews)

Router.patch("/apkupdate/:apkTitle", protect, apkController.uploadImage, apkController.updateApk);
Router.patch("/addApkFile/:title", protect, apkController.uploadFile, apkController.uploadFileHandler);
Router.delete("/deletesubcate/:cate", protect, apkController.deleteSubcategory);
Router.patch("/addApkImages/:title",  protect, apkController.uploadMultiImages.array("images", 10), apkController.saveImages, apkController.uploadImagesHandler);
Router.get("/allApk", protect,apkController.getAllApk);
// temporary for testing purpose
Router.get(`/temporary-download/:apkId`, apkController.temporaryDownload)



Router.get("/states",protect ,restrictTo("admin"),apkController.getStates);
Router.delete("/deleteApk/:title",protect ,restrictTo("admin"), apkController.deleteApk);
Router.patch("/updateActions",protect ,restrictTo("admin"), apkController.updateActions);


// slider apis
Router.post("/allsliders", protect ,restrictTo("admin") ,sliderController.getAll);
Router.post("/addSlider", protect, restrictTo("admin") ,apkController.uploadImage, sliderController.addSlider);
Router.delete("/deleteSlider", protect,restrictTo("admin"), sliderController.deleteSlider);
Router.patch("/activeSwitch/:title", protect,restrictTo("admin"), sliderController.activeSwitch);


// categories apis
Router.post("/addCate",protect, restrictTo("admin"), apkController.addCategory);
Router.patch("/addSubCate/:cate", protect, restrictTo("admin"),apkController.uploadImage, apkController.addSubCategory);
Router.patch("/editSubCate/:cate/:subcate", protect, restrictTo("admin"),apkController.uploadImage, apkController.editSubCategory);
Router.get("/subcate/:cate", protect, restrictTo("admin"),apkController.getSubcategories );
Router.delete("/deleteCate/:cate", protect, restrictTo("admin"),apkController.removeCategory);

Router.post("/paystack/create-reference", protect, apkController.saveReference);
Router.post("/paystack/verify-reference", protect, apkController.verifyReference);

// Router.post("/signin", apkController.signin);
// Router.get("/getAll", apkController.getAllUsers);
module.exports = Router;
