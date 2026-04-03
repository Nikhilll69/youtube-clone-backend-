
import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { Tweet } from "../models/tweet.model.js"
import { Comment } from "../models/comment.model.js"




const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError("400","Video id missing")
    } 
    const video= await Video.findById(videoId)
    if(video ==null){
        throw new ApiError(404,"Video not found")
    }

    const existingLike= await Like.findOne({
        video:videoId,
        LikedBy:req.user?._id
    })
    if(existingLike){
        await Like.findByIdAndDelete(existingLike?._id)
        return res.status(200)
        .json(
            new ApiResponse(200,"video unliked successfully",{isliked:false})
        )
    }

    const likedvideo= await Like.create({
        video:videoId,
        likedBy:req?.user?._id
    }) 
    
    return res.status(200)
    .json(
        new ApiResponse(200,"Video liked succesfullly",{isLiked:true ,likedvideo})
    )
   
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
     if(!isValidObjectId(commentId)){
        throw new ApiError(404,"comment id missing")

     }
     
     const comment = Comment.findById(commentId)
     if(!comment){
        throw new ApiError(404,"no comment found")
     }

     const existingLike= Comment.findOne({
        comment : commentId,
        likedBy : req.user?._id
     })

     if(existingLike){
        await Like.findByIdAndDelete(existingLike?._id)

        return res.status(200)
        .json(
            new ApiResponse(200,"comment unliked successfully",{ isLiked:false })
        )
     }
     const likedComment= await Like.create({
        comment : commentId,
        likedBy : req.user?._id
     })

     return res.status(200)
     .json(
        new ApiResponse(200,"comment liked succesfully",{isLiked : true ,likedComment})
     )

    

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    if(!tweetId){
        throw new ApiError(404,"tweetId is missing")
    }

    const tweet = Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404,"Comment not Found")
    }
    const existingLike = Tweet.findOne({
        tweet : tweetId,
        likedBy : req.user?._id
    })
    
    if(existingLike){
       await Like.findByIdAndDelete(existingLike?._id)
       return res.status(200)
       .json(
        new ApiResponse(200,"tweet unliked succesfully",{isliked : false})
       )
    }
     const likedTweet =Like.create({

        tweet: tweetId,
        likedby : req.user?._id

     })

     return res.status(200)
     .json(
        new ApiResponse(200,"tweet liked successfully" ,{isliked : true , likedTweet})
     )
}
)

const getLikedVideos  = asyncHandler(async (req, res) => {
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id),
                video: { $ne: null }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$video"
        },
        {
            $replaceRoot: {
                newRoot: "$video"
            }
        },
        {
            $sort: {
                createdAt: -1
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}
