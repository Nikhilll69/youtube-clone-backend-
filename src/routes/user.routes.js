import { Router } from "express";
import { registerUser,LoginUser, LogoutUser, refreshToken, changeCurrentPassword, getCurrentUser, updateUser, updateAvatar, updateCoverImage } from "../controllers/user.controller.js";
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

router.route("/update-user").put(verifyJWT,updateUser);

router.route("/update-avatar").put(verifyJWT,upload.single("avatar"),updateAvatar);

router.route("/update-cover-image").put(verifyJWT,upload.single("coverImage"),updateCoverImage);




export default router