import asyncHandler from '../utils/asyncHandler.js'  
import {ApiError} from "../utils/ApiError.js"
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/Cloudinary.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { generateAccessAndRefreshToken } from '../utils/genrateTokens.js'
import jwt from "jsonwebtoken"

/* Register User */
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

/*Login user*/
const LoginUser=asyncHandler(async(req,res)=>{

   const {email ,password,username}=req.body
   if(!email || !username){
    throw new ApiError(400,"Email or username are required");
   }
   if(!password){
    throw new ApiError(400,"Password is required");
   }
   const user =await User.findOne({
    $or:[{email},{username}]
   })
   if(!user){
    throw new ApiError(404,"User does not exists")
   }
   const isPasswordValid= await user.isPasswordCorrect(password)
   if(!isPasswordValid){
    throw new ApiError(401,"Invalid user credentials")
   }
   const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id);
   const loggedInUser= await User.findById(user._id)?.select(
      "-password -refreshToken"
   )
   const options={
    httpOnly:true,
    secure:true,

   }
   return res.status(200).cookie("accessToken",accessToken,options).cookie("refreshToken",refreshToken,options)
   .json(
    new  ApiResponse(
      200,
     {
       user:loggedInUser,
        accessToken,
        refreshToken
     },
     "User logged in successfully"
      
      
    )
   )
   
   

})

/*Logout user*/ 
const LogoutUser=asyncHandler(async(req,res)=>{

   await User.findByIdAndUpdate(
      req.user._id,
      {
         $unset:{
            refreshToken:1
         }
      },
      {
         new:true
      }
   )
const options={
   httpOnly:true,
   secure:true,
}

return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken",options)
.json(
   new ApiResponse(200,{},"User logged out successfully")
) 

   
})


const refreshToken = asyncHandler(async(req,res)=>{
   const incomingRefreshToken=req.cookies.refreshToken || 
   req.header("Authorization")?.replace("Bearer ","")

   console.log("incomingRefreshToken",incomingRefreshToken)
   if(!incomingRefreshToken){
      throw new ApiError(401,"Unauthorized user")

   }
try{
 const decodedToken=  jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
 const user=await User.findById(decodedToken._id)

 if(!user){
   throw new ApiError(401,"Invalid refresh token")
 }
 console.log("userToken",user)

 if(incomingRefreshToken !== user?.refreshToken){
   throw new ApiError(401,"Refresh token expired or used")
 }
   
 const options ={
   httpOnly:true,
   secure:true,
 }
const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)
 return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
      new ApiResponse(
         200,
         {
            accessToken,
            refreshToken
         },
         "Refresh token generated successfully"
      )
    )
}
catch(error){
   throw new ApiError(401,error?.message || "Invalid refresh token")
}
})

export {
   registerUser,
   LoginUser,
   LogoutUser,
   refreshToken
}