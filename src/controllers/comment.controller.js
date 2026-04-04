import { isValidObjectId } from 'mongoose'
import { Comment } from '../models/comment.model.js'
import { Video } from '../models/video.model.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const getVideoComments = asyncHandler(async (req, res) => {
  // TODO: get all comments for a video
  const { videoId } = req.params
  const { page = 1, limit = 10 } = req.query

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'invalid video id')
  }

  const pageNumber = Number(page)
  const limitNumber = Number(limit)

  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    throw new ApiError(400, 'invalid page number')
  }

  if (!Number.isInteger(limitNumber) || limitNumber < 1) {
    throw new ApiError(400, 'invalid limit')
  }

  const comments = await Comment.find({ video: videoId })
    .sort({ createdAt: -1 })
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber)

  return res
    .status(200)
    .json(new ApiResponse(200, 'comments fetched successfully', comments))
})

const addComment = asyncHandler(async (req, res) => {
  const { videoId, content } = req.body

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'invalid video id')
  }

  if (!content?.trim()) {
    throw new ApiError(400, 'comment is required')
  }

  const video = await Video.findById(videoId)
  if (!video) {
    throw new ApiError(404, 'video not found')
  }

  const comment = await Comment.create({
    content: content.trim(),
    video: videoId,
    owner: req.user?._id,
  })

  return res
    .status(201)
    .json(new ApiResponse(201, 'comment added successfully', comment))
})

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params
  const { content } = req.body

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, 'invalid comment id')
  }

  if (!content?.trim()) {
    throw new ApiError(400, 'comment is required')
  }

  const updatedComment = await Comment.findOneAndUpdate(
    {
      _id: commentId,
      owner: req.user?._id,
    },
    {
      content: content.trim(),
    },
    {
      new: true,
      runValidators: true,
    }
  )

  if (!updatedComment) {
    throw new ApiError(404, 'comment not found')
  }

  return res
    .status(200)
    .json(new ApiResponse(200, 'Comment updated successfully', updatedComment))
})

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, 'invalid comment id')
  }
  const deletedComment = await Comment.findOneAndDelete({
    _id: commentId,
    owner: req.user?._id,
  })
  if (!deletedComment) {
    throw new ApiError(404, 'no comment found')
  }
  return res
    .status(200)
    .json(new ApiResponse(200, 'comment deleted successfully', deletedComment))
})

export { getVideoComments, addComment, updateComment, deleteComment }
