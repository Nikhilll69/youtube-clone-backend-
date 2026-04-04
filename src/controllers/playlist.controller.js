import mongoose, { isValidObjectId } from 'mongoose'
import { Playlist } from '../models/playlist.model.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body
  if (!name || !description) {
    throw new ApiError(400, 'All fields are required')
  }
  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user?._id,
    videos: [],
  })
  if (!playlist) {
    throw new ApiError(500, 'Failed to create playlist')
  }
  return res
    .status(201)
    .json(
      new ApiResponse(201, 'Playlist created successfully', playlist.toObject())
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params
  if (isValidObjectId(userId)) {
    throw new ApiError(400, 'Invalid user id')
  }
  const playlists = await Playlist.find({ owner: userId })
  if (!playlists) {
    throw new ApiError(404, 'No playlists found')
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        'Playlists fetched successfully',
        playlists.toObject()
      )
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params
  if (isValidObjectId(playlistId)) {
    throw new ApiError(400, 'Invalid playlist id')
  }
  const playlist = await Playlist.findById(playlistId)
  if (!playlist) {
    throw new ApiError(404, 'Playlist not found')
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, 'Playlist fetched successfully', playlist.toObject())
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, 'invalid playlist id')
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'invalid video id')
  }
  const addedVideo = await Playlist.findByIdAndUpdate(
    playlistId,
    { $addToSet: { videos: videoId } },
    { new: true }
  )
  if (!addedVideo) {
    throw new ApiError(404, 'playlist not found')
  }
  return res
    .status(200)
    .json(new ApiResponse(200, 'video added successfully', addedVideo))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, 'invalid playlist id')
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, 'invalid video id')
  }
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $pull: { videos: videoId } },
    { new: true }
  )

  if (!updatedPlaylist) {
    throw new ApiError(404, 'playlist not found')
  }
  return res 
    .status(200)
    .json(new ApiResponse(200, 'video removed successfully', updatedPlaylist))
})

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, 'invalid playlist id')
  }

  const deletedPlaylist = await Playlist.findOneAndDelete({
    _id: playlistId,
    owner: req.user?._id,
  })
  if (!deletedPlaylist) {
    throw new ApiError(404, 'playlist not found')
  }
  return res
    .status(200)
    .json(new ApiResponse(200, 'playlist deleted successfully', deletedPlaylist))
})

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params
  const { name, description } = req.body
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, 'invalid playlist id')
  }
  if (!name?.trim() || !description?.trim()) {
    throw new ApiError(400, 'All fields are required')
  }
  const updatedPlaylist = await Playlist.findOneAndUpdate(
    {
      _id: playlistId,
      owner: req.user?._id,
    },
    {
      name: name.trim(),
      description: description.trim(),
    },
    {
      new: true,
    }
  )
  if (!updatedPlaylist) {
    throw new ApiError(404, 'playlist not found')
  }
  return res
    .status(200)
    .json(new ApiResponse(200, 'playlist updated successfully', updatedPlaylist))
})

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
}
