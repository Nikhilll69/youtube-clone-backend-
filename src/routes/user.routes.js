import { Router } from "express";
import { registerUser,LoginUser, LogoutUser, refreshToken, changeCurrentPassword, getCurrentUser, updateUser, updateAvatar, updateCoverImage, getUserChannelProfile, getwatchHistory } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router =Router()



router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser

);

router.route("/login").post(LoginUser);

//SECURE ROUTES
router.route("/logout").post(verifyJWT,LogoutUser);

router.route("/refresh-token").post(refreshToken);

router.route("/change-password").post(verifyJWT,changeCurrentPassword);

router.route("/current-user").get(verifyJWT,getCurrentUser);

router.route("/update-user").patch(verifyJWT,updateUser);

router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateAvatar);

router.route("/update-cover-image").patch(verifyJWT,upload.single("coverImage"),updateCoverImage);

router.route("/channel/:username").get(getUserChannelProfile);

router.route("/watch-history").get(verifyJWT,getwatchHistory);




export default router