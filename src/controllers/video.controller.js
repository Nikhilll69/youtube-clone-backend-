import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/Cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {

    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    const pageNumber = parseInt(page)
    const limitNumber = parseInt(limit)

    const skip = (pageNumber - 1) * limitNumber

    // filter
    const filter = {}

    if (query) {
        filter.title = { $regex: query, $options: "i" }
    }

    if (userId) {
        filter.owner = userId
    }

    // sorting
    const sortOptions = {}

    if (sortBy) {
        sortOptions[sortBy] = sortType === "asc" ? 1 : -1
    } else {
        sortOptions.createdAt = -1
    }

    const videos = await Video.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNumber)

    const totalVideos = await Video.countDocuments(filter)


    res.status(200).json(new ApiResponse(200, {
        videos,
        totalVideos,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(totalVideos / limitNumber)
    }, "Videos fetched successfully"))

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video
    const videoFile = req.files?.videoFile[0]
    const thumbnailFile = req.files?.thumbnail[0]

    if (!videoFile || !thumbnailFile) {
        throw new ApiError(400, "Video and thumbnail are required")
    }

    const videoUpload = await uploadOnCloudinary(videoFile.path)
    const thumbnailUpload = await uploadOnCloudinary(thumbnailFile.path)

    if (!videoUpload || !thumbnailUpload) {
        throw new ApiError(500, "Failed to upload video or thumbnail")
    }

    const video = await Video.create({
        title: title || "",
        description: description || "",
        videoFile: videoUpload.url,
        thumbnail: thumbnailUpload.url,
        duration: videoUpload.duration,
        views: 0,
        isPublished: true,
        path: videoUpload.url,  
        owner: req.user._id
    })

    res.status(201).json(new ApiResponse(201, video, "Video published successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}