
import { Tweet } from '../models/tweet.model.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import mongoose, { isValidObjectId } from 'mongoose'

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body
 if (typeof content !== "string" || !content.trim()) {
  throw new ApiError(400, "Tweet content is required");
}


  const tweet = await Tweet.create({
    content,
    owner: req.user?._id,
  })
  if (!tweet) {
    throw new ApiError(500, 'error while creating tweet')
  }
  return res
    .status(200)
    .json(new ApiResponse(200, 'tweet created successfully', tweet))
})

const getUserTweets = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, 'Unauthorized')
  }

  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: 'likes',
        localField: '_id',
        foreignField: 'tweet',
        as: 'likes',
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: '$likes',
        },
        isLiked: {
          $in: [new mongoose.Types.ObjectId(req.user._id), '$likes.likedBy'],
        },
      },
    },
    {
      $project: {
        content: 1,
        owner: 1,
        createdAt: 1,
        updatedAt: 1,
        likesCount: 1,
        isLiked: 1,
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
    .json(new ApiResponse(200, 'tweets fetched successfully', tweets))
})


const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params
  const { content } = req.body

  if (!req.user?._id) {
    throw new ApiError(401, 'Unauthorized')
  }

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, 'Invalid tweet id')
  }

  if (typeof content !== 'string' || !content.trim()) {
    throw new ApiError(400, "Tweet content can't be empty")
  }

  const tweet = await Tweet.findOneAndUpdate(
    {
      _id: tweetId,
      owner: req.user._id,
    },
    {
      content: content.trim(),
    },
    {
      new: true,
      runValidators: true,
    }
  )

  if (!tweet) {
    throw new ApiError(404, 'Tweet not found or unauthorized')
  }

  return res
    .status(200)
    .json(new ApiResponse(200, 'Tweet updated successfully', tweet))
})

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params

  if (!req.user?._id) {
    throw new ApiError(401, 'Unauthorized')
  }

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, 'Invalid tweet id')
  }

  const tweet = await Tweet.findOneAndDelete({
    _id: tweetId,
    owner: req.user._id,
  })

  if (!tweet) {
    throw new ApiError(404, 'Tweet not found or unauthorized')
  }

  return res
    .status(200)
    .json(new ApiResponse(200, 'Tweet deleted successfully', tweet))
})




export { createTweet, getUserTweets, updateTweet, deleteTweet }
