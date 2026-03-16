import asyncHandler from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/Cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { generateAccessAndRefreshToken } from '../utils/genrateTokens.js'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'

/* Register User */
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body

  if ([fullName, email, username, password].some((field) => !field?.trim())) {
    throw new ApiError(400, 'All feilds are Required')
  }
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  })

  if (existedUser) {
    throw new ApiError(
      409,
      'User with this email or username is already existed '
    )
  }

  const avatarLocalPath = req.files?.avatar[0]?.path

  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar is required')
  }
  // const coverLocalpath= req.files?.coverImage[0]?.path;

  let coverLocalPath

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverLocalPath = req.files.coverImage[0].path
  }

  console.log(
    'avatarLocalpath',
    avatarLocalPath,
    'coverLocalpath',
    coverLocalPath
  )

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if (!avatar?.url) {
      throw new ApiError(500, "Failed to upload avatar")
  }

  const coverImage = await uploadOnCloudinary(coverLocalPath)
  console.log('avatar', avatar, 'coverImage', coverImage)
  const user = await User.create({
    fullName,
    email,
    avatar: avatar?.url,
    coverImage: coverImage?.url || '',
    password,
    username: username.toLowerCase(),
  })

  const createdUser = await User.findById(user._id)?.select(
    '-password -refreshToken'
  )
  if (!createdUser) {
    throw new ApiError(500, 'Something went wrong while creating user')
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, 'User registed Successfully'))
})

/*Login user*/
const LoginUser = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body
  if (!email || !username) {
    throw new ApiError(400, 'Email or username are required')
  }
  if (!password) {
    throw new ApiError(400, 'Password is required')
  }
  const user = await User.findOne({
    $or: [{ email }, { username }],
  })
  if (!user) {
    throw new ApiError(404, 'User does not exists')
  }
  const isPasswordValid = await user.isPasswordCorrect(password)
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid user credentials')
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  )
  const loggedInUser = await User.findById(user._id)?.select(
    '-password -refreshToken'
  )
  const options = {
    httpOnly: true,
    secure: true,
  }
  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        'User logged in successfully'
      )
    )
})

/*Logout user*/
const LogoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  )
  const options = {
    httpOnly: true,
    secure: true,
  }

  return res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponse(200, {}, 'User logged out successfully'))
})

const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken ||
    req.header('Authorization')?.replace('Bearer ', '')

  console.log('incomingRefreshToken', incomingRefreshToken)
  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Unauthorized user')
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
    const user = await User.findById(decodedToken._id)

    if (!user) {
      throw new ApiError(401, 'Invalid refresh token')
    }
    console.log('userToken', user)

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, 'Refresh token expired or used')
    }

    const options = {
      httpOnly: true,
      secure: true,
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    )
    return res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken,
          },
          'Refresh token generated successfully'
        )
      )
  } catch (error) {
    throw new ApiError(401, error?.message || 'Invalid refresh token')
  }
})

/*chnage current password*/
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, 'Old password and new password are required')
  }
  const user = await User.findById(req.user._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  if (!isPasswordCorrect) {
    throw new ApiError(401, 'Invalid password')
  }
  user.password = newPassword
  await user.save({ validateBeforeSave: false })
  return res
    .status(200)
    .json(new ApiResponse(200, user, 'Password changed successfully'))
})

/* get current user*/

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, 'User fetched successfully'))
})

/* update user*/

const updateUser = asyncHandler(async (req, res) => {
  const { fullName, username, email } = req.body
  if (!fullName || !username || !email) {
    throw new ApiError(400, 'All fields are required')
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      fullName,
      username: username.toLowerCase(),
      email,
    },
    {
      new: true,
    }
  )
  return res
    .status(200)
    .json(new ApiResponse(200, user, 'User updated successfully'))
})

/* update avatar*/
const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path
  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar is required')
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  if (!avatar?.url) {
    throw new ApiError(500, 'Failed to upload avatar')
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      avatar: avatar.url,
    },
    {
      new: true,
    }
  ).select('-password -refreshToken')
  return res
    .status(200)
    .json(new ApiResponse(200, user, 'Avatar updated successfully'))
})

/* update cover image*/
const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path
  if (!coverImageLocalPath) {
    throw new ApiError(400, 'Cover image is required')
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  if (!coverImage?.url) {
    throw new ApiError(500, 'Failed to upload cover image')
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      coverImage: coverImage.url,
    },
    {
      new: true,
    }
  ).select('-password -refreshToken')
  return res
    .status(200)
    .json(new ApiResponse(200, user, 'Cover image updated successfully'))
})

/*user channel profile*/

const getUserChannelProfile = asyncHandler(async (req, res) => {

  const { username } = req.params

  if (!username) {
    throw new ApiError(400, 'username is missing')
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
     
    },
    {
       $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'channel',
        as: 'subscribers',
      }
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'subscriber',
        as: 'subscribedTo',
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: '$subscribers',
        },
        channelSubscribedToCount: {
          $size: '$subscribedTo',
        },
        isSubscribed:{
          $cond:{
            if:{$in:[req.user?._id,"$subscribers.subscriber"]},
            then:true,
            else:false
          }
        }
      },
     
    },
   {  
        $project:{
          fullName:1,
          username:1,
          subscribersCounts:1,
          channelSubscribedToCount:1,
          IntersectionObserverEntry:1,
          avatar:1,
          coverImage:1,
          email:1

        }
   }
  ])
  console.log("channel",channel)
  if(!channel?.length){
    throw new ApiError("404","channel does not exists");
  }
  return res.status(200)
  .json(
    new ApiResponse(200,channel[0],"user channel fetched successfully")
  )
}) 

/* user watch history*/

const getwatchHistory=asyncHandler(async(req,res)=>{
 const user =await User.aggregate([
   {
      $match:{
         _id:new mongoose.Types.ObjectId(req.user?._id)


      }
   },
   {
      $lookup:{
         from:"videos",
         localField:"watchHistory",
         foreignField:"_id",
         as:"watchHistory",
         pipeline:[
            {
               $lookup:{
                  from:"users",
                  localField:"owner",
                  foreignField:"_id",
                  as:"owner",
                  pipeline:[
                     {
                        $project:{
                           username:1,
                           fullName:1,
                           avatar:1
                        }
                     }
                  ]
               }
            },
            {
               $addFields:{
                  owner:{
                     $first:"$owner"
                  }
               }
            }
         ]
      }
   }


  
 ])
  return res.status(200)
   .json(
      new ApiResponse(200,user[0].watchHistory,"watch history fetched successfully")
   )
  
});

export {
  registerUser,
  LoginUser,
  LogoutUser,
  refreshToken,
  getCurrentUser,
  changeCurrentPassword,
  updateUser,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getwatchHistory
}
