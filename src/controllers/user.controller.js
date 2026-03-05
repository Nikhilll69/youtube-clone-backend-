import asyncHandler from '../utils/asyncHandler.js'  
import {ApiError} from "../utils/ApiError.js"
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/Cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'


const registerUser = asyncHandler( async (req ,res) =>{
   const {fullName,email,username,password}=req.body

   console.log("================================",req.files)

   if(
      [fullName, email, username, password].some(
  (field) => !field?.trim()
)
   ){ 
          throw  new ApiError(400,"All feilds are Required")
   }
 const existedUser= await  User.findOne({
      $or:[
         {username},
         {email}
      ]
   })
   
   if(existedUser){
      throw new ApiError(409,"User with this email or username is already existed ")
   }
 
   const avatarLocalPath=  req.files?.avatar[0]?.path;
   
  
  if(!avatarLocalPath){
      throw new ApiError(400,"Avatar is required")
   }
   // const coverLocalpath= req.files?.coverImage[0]?.path;

     let coverLocalPath;
 
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverLocalPath = req.files.coverImage[0].path
    }


   console.log("avatarLocalpath",avatarLocalPath,"coverLocalpath",coverLocalPath
      
   )
  
   const avatar= await uploadOnCloudinary(avatarLocalPath)
   
   
   // if (!avatar?.url) {
   //     throw new ApiError(500, "Failed to upload avatar")
   // }
   
   const coverImage=await uploadOnCloudinary(coverLocalPath) 
   console.log("avatar",avatar,"coverImage",coverImage)
 const user = await  User.create({
   fullName,
   email,
   avatar:avatar?.url,
   coverImage:coverImage?.url || "",
   password,
   username:username.toLowerCase()
  })

 const createdUser= await  User.findById(user._id)?.select(
   "-password -refreshToken"
 )
 if(!createdUser){
   throw new ApiError(500 ,"Something went wrong while creating user")
 }


 return res.status(201).json(
   new ApiResponse(200,createdUser,"User registed Successfully")

 )
}
  
)




export {
   registerUser
}