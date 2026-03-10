import { Router } from "express";
import { registerUser,LoginUser, LogoutUser, refreshToken } from "../controllers/user.controller.js";
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

router.route("/refresh-token").post(refreshToken)




export default router