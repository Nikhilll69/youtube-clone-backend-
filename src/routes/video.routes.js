import { Router } from "express";
import { uploadVideos , getUserVideos , deleteVideo ,getAllVideos , updateVideo ,getVideoById ,togglePublishStatus } from "../controllers/video.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router()

router.route("/publish").post(verifyJWT,
    upload.fields([
        {
            name:"thumbnail",
            maxCount:1
        },
        {
            name:"videoFile",
            maxCount:1
        }

    ]),
    uploadVideos
)
router.route("/user/:userId").get(verifyJWT ,getUserVideos)
router.route("/deletde/:videoId").delete(verifyJWT,deleteVideo)
router.route("/").get(getAllVideos)
router.route("/update/:videoId").patch(verifyJWT, upload.fields([
    {

        name:"thumbnail",
        maxCount:1  
    }
]) ,updateVideo)
router.route("/:videoId").get(getVideoById)
router.route("/change-status/:videoId").patch(verifyJWT,togglePublishStatus)


export default router