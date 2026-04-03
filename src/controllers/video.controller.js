import asyncHandler from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { Video } from '../models/video.model.js'
import { uploadOnCloudinary } from '../utils/Cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { generateAccessAndRefreshToken } from '../utils/genrateTokens.js'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'

/* Publish videos*/
const uploadVideos = asyncHandler(async (req, res) => {
  const { title, description } = req.body
  console.log(title, description)
  console.log(req?.user?._id)

  if (!title || !description) {
    throw new ApiError(400, 'All feilds are required')
  }

  const videoLocalPath = req?.files?.videoFile?.[0]?.path

  const thumbnailLocalpath = req?.files?.thumbnail?.[0]?.path
  if (!videoLocalPath || !thumbnailLocalpath) {
    throw new ApiError(400, 'video or thumbnail not found')
  }
  const [video, thumbnailImage] = await Promise.all([
    uploadOnCloudinary(videoLocalPath),
    uploadOnCloudinary(thumbnailLocalpath),
  ])

  if (!video || !thumbnailImage) {
    throw new ApiError(400, 'Failed to upload thumbnail or video')
  }

  if (!video?.url || typeof video?.duration !== 'number') {
    throw new ApiError(400, 'Uploaded video metadata is incomplete')
  }

  if (!thumbnailImage?.url) {
    throw new ApiError(400, 'Uploaded thumbnail metadata is incomplete')
  }

  console.log(req.user?._id, 'userId')

  const saveVideo = await Video.create({
    title,
    description: description,
    duration: video?.duration,
    thumbnail: thumbnailImage?.secure_url || thumbnailImage?.url,
    videoFile: video?.secure_url || video?.url,
    owner: req.user?._id,
  })
  if (!saveVideo) {
    throw new ApiError(500, 'failed to upload video')
  }

  return res
    .status(200)
    .json(new ApiResponse(200, 'video uploaded successfully',saveVideo))
})

/*get user videos*/

const getUserVideos = asyncHandler(async (req, res) => {
  const { userId } = req.params
  console.log('userId', userId)
  if (!userId) {
    throw new ApiError(400, 'user id required')
  }
  const videos = await Video.find({ owner: userId }).sort({ createdAt: -1 })

  if (!videos) {
    throw new ApiError(400, 'failed to get videos')
  }

  console.log(videos)
  return res
    .status(200)
    .json(new ApiResponse(200, 'vidoes fetched successfully',videos))
})

/*delete Video */
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  if (!videoId) {
    throw new ApiError(400, 'Video Id is missing')
  }

  const video = await Video.findById(videoId)

  if (!video) {
    throw new ApiError(404, 'Video not found')
  }

  // 🔥 ownership check
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Unauthorized')
  }

  const result = await Video.deleteOne({ _id: videoId })

  if (result.deletedCount === 0) {
    throw new ApiError(500, 'Failed to delete video')
  }

  return res
    .status(200)
    .json(new ApiResponse(200, 'Video deleted successfully'))
})

//get all videos
const getAllVideos = asyncHandler(async (req, res) => {
  let {
    page = 1,
    limit = 10,
    query,
    sortBy = 'createdAt',
    sortType = 'desc',
    userId,
  } = req.query

  page = Number(page)
  limit = Number(limit)

  const filter = {}

  if (query?.trim()) {
    filter.$or = [
      { title: { $regex: query.trim(), $options: 'i' } },
      { description: { $regex: query.trim(), $options: 'i' } },
    ]
  }

  if (userId) {
    filter.owner = userId
  }

  const sortOrder = sortType === 'asc' ? 1 : -1

  console.log('filter', filter)

  const videos = await Video.find(filter)
    .sort({ [sortBy]: sortOrder })
    .skip((page - 1) * limit)
    .limit(limit)

  const totalVideos = await Video.countDocuments(filter)

  const data = {
    videos,
    totalVideos,
    currentPage: page,
    totalPages: Math.ceil(totalVideos / limit),
  }

  return res
    .status(200)
    .json(new ApiResponse(200, 'Videos fetched successfully',data))
})

 const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req?.body;
  
  // 🔍 Step 1: Validate videoId
  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  // 🔍 Step 2: Find video
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // 🔐 Step 3: Ownership check
  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(403, "You are not allowed to update this video");
  }

  // 🧠 Step 4: Build update object
  const updateData = {};

  if (title?.trim()) updateData.title = title.trim();
  if (description?.trim()) updateData.description = description.trim();

  // 📸 Step 5: Handle thumbnail update
  const thumbnailLocalPath = req?.files?.thumbnail?.[0]?.path;

  if (thumbnailLocalPath) {
    const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!uploadedThumbnail?.url && !uploadedThumbnail?.secure_url) {
      throw new ApiError(400, "Thumbnail upload failed");
    }

    updateData.thumbnail =
      uploadedThumbnail.secure_url || uploadedThumbnail.url;

    // 🧠 (optional but recommended)
    // 👉 delete old thumbnail from Cloudinary using public_id
  }

  // ❌ Step 6: No data to update
  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "No valid fields provided for update");
  }

  // 🔄 Step 7: Update video
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    updateData,
    {
      new: true,
      runValidators: true, // 🔥 important for schema validation
    }
  );

  return res.status(200).json(
    new ApiResponse(200, "Video updated successfully",updatedVideo)
  );
});
 
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
      throw new ApiError(400,"Video Id required")
    }
    const video = await Video.findById(
      videoId
    )
    
    if(video===null){
      throw new ApiError(404," video does not exits")
    }
    return res.status(200)
    .json(new ApiResponse(200,"video fecthed successfully" ,video))
})

  const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const  {isPublished }= req.body
   if(!videoId){
    throw new ApiError(400,"video id missing")
   }
     if (typeof isPublished !== "boolean") {
    throw new ApiError(400, "isPublished must be a boolean");
  }

    const video= await Video.findById(videoId);
    if(video==null){
      throw new ApiError(400,"video not found")
    }
   
    if(video.owner.toString() !== req.user?._id.toString()){
      throw new ApiError(403,"unauthorized request")
    }
    const result = await Video.findByIdAndUpdate(videoId ,{isPublished},{new:true})

    return res.status(200)
    .json(
      new ApiResponse(200,"Video status chnaged sucessfully" , result)
    )


})

 


export { uploadVideos, getUserVideos, deleteVideo, getAllVideos,updateVideo ,getVideoById ,togglePublishStatus }
