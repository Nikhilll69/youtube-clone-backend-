import mongoose from 'mongoose'
import { Video } from '../models/video.model.js'
import { Subscription } from '../models/subscription.model.js'
import { Like } from '../models/like.model.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const getChannelStats = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, 'Unauthorized request')
  }

  const channelId = new mongoose.Types.ObjectId(req.user._id)

  const [videoStats, totalSubscribers, likeStats] = await Promise.all([
    Video.aggregate([
      {
        $match: {
          owner: channelId,
        },
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
          totalVideos: { $sum: 1 },
        },
      },
    ]),
    Subscription.countDocuments({
      channel: channelId,
    }),
    Like.aggregate([
      {
        $lookup: {
          from: 'videos',
          localField: 'video',
          foreignField: '_id',
          as: 'videoDetails',
        },
      },
      {
        $unwind: '$videoDetails',
      },
      {
        $match: {
          'videoDetails.owner': channelId,
        },
      },
      {
        $group: {
          _id: null,
          totalLikes: { $sum: 1 },
        },
      },
    ]),
  ])

  const stats = {
    totalViews: videoStats[0]?.totalViews || 0,
    totalVideos: videoStats[0]?.totalVideos || 0,
    totalSubscribers,
    totalLikes: likeStats[0]?.totalLikes || 0,
  }

  return res
    .status(200)
    .json(new ApiResponse(200, 'Channel stats fetched successfully', stats))
})

const getChannelVideos = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, 'Unauthorized request')
  }

  const channelId = new mongoose.Types.ObjectId(req.user._id)
  const videos = await Video.aggregate([
    {
      $match: {
        owner: channelId,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ])

  return res
    .status(200)
    .json(new ApiResponse(200, 'Channel videos fetched successfully', videos))
})

export { getChannelStats, getChannelVideos }
