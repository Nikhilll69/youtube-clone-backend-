import asyncHandler from '../utils/asyncHandler.js'  
import {ApiError} from "../utils/ApiError.js"
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/Cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'


const registerUser = asyncHandler( async (req ,res) =>{
   const {fullName,email,username,password}=req.body

   if(
      [fullName,email,username,password].some((feild)=>feild?.trim()==="")
   ){ 
          throw  new ApiError(400,"All feilds are Required")
   }
 const existedUser=  User.findOne({
      $or:[
         {username},
         {email}
      ]
   })
   
   if(existedUser){
      throw new ApiError(409,"User with this email or username is already existed ")
   }
   const avatarLocalpath=req.files?.avatar[0]?.path;
   const coverLocalpath=req.files?.coverImage[0]?.path
   if(!avatarLocalpath){
      throw new ApiError(400,"Avatar is required")
   }
  const avatar= await uploadOnCloudinary(avatarLocalpath)
  const coverImage=await uploadOnCloudinary(coverLocalpath) 
 const user = await  User.create({
   fullName,
   email,
   avatar:avatar.url,
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