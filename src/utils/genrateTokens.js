const generateAccessAndRefreshToken=async(userId ,User)=>{
   try {
      const user=await User.findById(userId);
      
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();
      await user.save({validateBeforeSave:false})
      return {
         accessToken,
         refreshToken
      }
      
   } catch (error) {
      throw new ApiError(500,"Something went wrong while generating access and refresh token")
   }
}