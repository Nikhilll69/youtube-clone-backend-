/*
export const asyncHandler = (requesthandler)=> async (req,res,next)=>{
    try {
        await requesthandler(req,res,next)
        
    } catch (error) {
        res.status(err.code || 500).json({
            success:false,
            message:err.message
        })
        
    }

}
    */

export const asyncHandler = (requestHandler) => {
  ;  return (req, res, next) => {
   Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
  }
}

export default asyncHandler