import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import { deleteFromCloudinary, uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/apiResponse.js';
import jwt from 'jsonwebtoken';


const generateAccessAndRefreshToken = async (userId)=>{
try {
    const user = await User.findById(userId);
const accessToken = user.generateAccessToken();
const refreshToken = user.generateRefreshToken();

user.refreshToken = refreshToken;
await user.save({validateBeforeSave: false });

return {refreshToken, accessToken}
} catch (error) {
   throw new ApiError(500, "Somehting went wrong while generating the access and refresh token")
}
  
}

const registerUser = asyncHandler( async (req, res)=>{
   const {username, email, fullName, password} = req.body;
   if(
      [username, email, fullName, password].some(field => field?.trim() === '')
   ){
      throw new ApiError(400, "All fields are required")
   }
  

   const existedUser = await User.findOne({
         $or : [{ username }, { email }]
   })


   if(existedUser){
     throw new ApiError(409, "User with same email or username already exists")
   }

   const avatarLocalPath = req.files?.avatar[0].path;
   let coverImageLocalPath ;

   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ){
   coverImageLocalPath = req.files.coverImage[0].path;
   }

   
   if(!avatarLocalPath){
      throw new ApiError(400, "Avatar file is required")
      }

   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);
 
    if(!avatar){
    throw new ApiError(400, "avatar file is required")
    }

  const user = await User.create({

      fullName,
      username : username.toLowerCase(),
      email,
      password,
      avatar : avatar.url,
      coverImage : coverImage?.url || ""
   })

   const createdUser = await User.findById(user._id).select("-password -refreshToken");

   if(!createdUser){
      throw new ApiError(500, "Something went wrong while registering the user")
   }

   return res.status(200).json(
      new ApiResponse(200, createdUser, "User registered successfully")
  );
  
})

const loginUser = asyncHandler(async (req, res) => {

console.log(  "req.body :", req.body)
const {username, email, password} = req.body;

if(!(username || email)){
   throw new ApiError(400, "username or email is required")
}
const user = await User.findOne({
   $or : [{username}, {email}]
})

if(!user){
   throw new ApiError(404, "User not registered")
}

const isPasswordCorrect = user.isPasswordCorrect(password);

if(!isPasswordCorrect){
   throw new ApiError(401, "Invalid user credentials")
}

const {refreshToken, accessToken} = await generateAccessAndRefreshToken(user._id);

const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

const options = {
   httpOnly : true,
   secure : true
}

 return res.status(200)
.cookie("accessToken", accessToken, options)
.cookie("refreshToken", refreshToken, options)
.json(
   new ApiResponse(200,
      {
         user : loggedInUser, refreshToken, accessToken
      },
      "User logged in successfully!"
   )
)

})

const logoutUser = asyncHandler(async (req, res) => {
 await User.findByIdAndUpdate(
   req.user._id,
   {
     $set : {refreshToken : undefined}
   },
   {
     new : true
   }
 )

 const options = {
   httpOnly : true,
   secure : true
 }

 return res.status(200)
 .clearCookie("accessToken", options)
 .clearCookie("refreshToken", options)
 .json(
   new ApiResponse(200, {}, "User logged out")
 )

})

const regenerateAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingToken = req.cookies?.refreshToken || req.body.refreshToken;
 
    if(!incomingToken){
    throw new ApiError(401, "Unauthorised request");
    }
 
    const decodedToken = jwt.verify(incomingToken, process.env.REFRESH_TOKEN_SECRET)
 
    const user = await User.findById(decodedToken?._id)
 
    if(!user){
       throw new ApiError(401, "Unauthorised request");
    }
 
    if(incomingToken !== user?.refreshToken){
       throw new ApiError(401, "Refresh token expired or used");
    }
 
    const {refreshToken, accessToken} = await generateAccessAndRefreshToken(user._id)
 
    const options = {
       httpOnly : true,
       secure : true
    }
 
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200,
       {accessToken, refreshToken},
       "Access token regenerated successfully!"
 
      )
    )
  } catch (error) {
   throw new ApiError(401, error?.message || "invalid refresh token")
  }
})

const changePassword = asyncHandler(async (req, res) => {
   try {
      const {oldPassword, newPassword } = req.body;
   
      const user = await User.findById(req.user._id);
   
      const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
   
      if(!isPasswordCorrect){
         throw new ApiError(400, "Incorrect password")
      }
   
     user.password = newPassword;
     await user.save({validateBeforeSave : false});

     return res.status(200)
     .json(
      new ApiResponse(200, {}, "Password changed successfully!")
     )
   } catch (error) {
      throw new ApiError(400, error?.message || "Incorrect Password")
   }


});

const getCurrentUser = asyncHandler(async (req, res) => {
   return res.status(200)
   .json(
      new ApiResponse(200, req.user, "User details fetched successfully" )
   )
});

const updateUserProfile = asyncHandler(async (req, res) => {
  try {
    const {fullName, email, username} = req.body;
 
    if(!(fullName || email || username)){
       throw new ApiError(400, "All fields are required")
    }
    const updatedUser = await User.findByIdAndUpdate(
       req.user._id,
       {
          $set : {
             fullName, username, email
          }
       }
    ,
    {
       new : true
    }
    ).select("-password -refreshToken")
 
    if(!updatedUser){
       throw new ApiError(500, "Something went wrong while updating the user details")
    }
 
 
    return res.status(200)
    .json(
       new ApiResponse(200, updatedUser, "Profile updated successfully!")
    )
  } catch (error) {
   throw new ApiError(400, error?.message || "All fields are required to be filled to be updated")
  }
   
});

const updateAvatar = asyncHandler(async (req, res) => {
  try {

  const user = await User.findById(req.user._id).select("-password -refreshToken");
  if(!user){
   throw new ApiError(400, "Unauthorised request")
  }

    
    const avatarPath = req.file?.path;
    
 
  if(!avatarPath){
    throw new ApiError(400, "Please upload the image")
  }
   console.log(req.user.avatar);

   if (req.user.avatar) {
      const fileDeleteResult = await deleteFromCloudinary(req.user.avatar);
      console.log(fileDeleteResult);
  }

   
    const newAvatar = await uploadOnCloudinary(avatarPath);
 
    if (!newAvatar || !newAvatar.url) {
      throw new ApiError(500, "Something went wrong while uploading file to Cloudinary");
  }

    const updatedUser = await User.findByIdAndUpdate(
       req.user?._id,
       {
          $set : {
             avatar : newAvatar.url
          }
       },
       {
          new : true
       }
    ).select("-password -refreshToken")
    
    if(!updatedUser){
       throw new ApiError(500, "Something went wrong while updating avatar")
    }
 
    return res.status(200)
    .json(
       new ApiResponse(200,
          updatedUser,
          "User avatar updated successfully!"
       )
    )
  } catch (error) {
   throw new ApiError(400, error?.message || "Please upload a file first")
  }
});


const updateCoverImage = asyncHandler(async (req, res) => {
   try {

      const user = await User.findById(req.user._id).select("-password -refreshToken");
      if(!user){
       throw new ApiError(400, "Unauthorised request")
      }
    
        
      const coverImagePath = req.file?.path;
        
     
      if(!coverImagePath){
        throw new ApiError(400, "Please upload the image")
      }
    
       if (req.user.coverImage && req.user.coverImage !== "" ) {
          const fileDeleteResult = await deleteFromCloudinary(req.user.coverImage);
          console.log(fileDeleteResult);
      }
    
      const newCoverImage = await uploadOnCloudinary(coverImagePath);
     
      if (!newCoverImage || !newCoverImage.url) {
          throw new ApiError(500, "Something went wrong while uploading file to Cloudinary");
      }
    
        const updatedUser = await User.findByIdAndUpdate(
           req.user?._id,
           {
              $set : {
                 coverImage : newCoverImage.url
              }
           },
           {
              new : true
           }
        ).select("-password -refreshToken")
        
        if(!updatedUser){
           throw new ApiError(500, "Somehting went wrong while updating coverImage")
        }
     
        return res.status(200)
        .json(
           new ApiResponse(200,
              updatedUser,
              "CoverImage updated successfully!"
           )
        )
      } catch (error) {
       throw new ApiError(400, error?.message || "Please upload a file first")
      }
 });

 const userChannelProfile = asyncHandler(async (req, res) => {
   const {username} = req.params;

   if(!username){
      throw new ApiError(400, "Username is missing")
   }

   const channel = await User.aggregate([
      {
         $match : {
            username : username?.toLowerCase()
         }
      },
      {
         $lookup : {
           from : "subscriptions",
           localField : "_id",
           foreignField : "channel",
           as : "subscribers"
         }

      },
      {
         $lookup : {
            from : "subscriptions",
            localField : "_id",
            foreignField : "subscribers",
            as : "subscribedTo"
          }
      },
      {
         $addFields : {
            subscribersCount :{
               $size : "$subscribers"
            },
            subscribedToCount : {
                $size : "$subscribedTo"
            },
            
            isSubscribed : {
                  $cond : {
                     if : {$in : [req.user?._id, "$subscribers.subscriber"]},
                     then : true,
                     else : false
                  }
               }
            
         }
      },
      {
         $project : {
            fullName : 1,
            username : 1,
            avatar : 1,
            coverImage : 1,
            subscribersCount : 1,
            subscribedToCount : 1
         }
      }
   ])

   if(!channel?.length){
      throw new ApiError(404, "Channel not found")
   }

   return res.status(200)
   .json(
      new ApiResponse(
         200,
         channel[0],
         "User channel fetched successfully!"
      )
   )
 });

 const watchHistory = asyncHandler(async (req, res) => {
   const user = await User.aggregate([
     {
      $match : {
         id : new mongoose.Types.ObjectId(req.user?._id)
      },
     },
     {
      $lookup : {
         from : "videos",
         localField : "watchHistory",
         foreignField : "_id",
         as : "watchHistory",
         pipeline : [
            {
               $lookup : {
                  from : "users",
                  localField : "owner",
                  foreignField : "_id",
                  as : "owner",
                  pipeline : [
                    {
                      $project : {
                        username : 1,
                        fullName : 1,
                        avatar : 1
                     }
                    }
                    
                  ]
               }
            },
            {
               $addFields : {
                  owner : {
                     $first : "$owner"
                  }
               }
            }
           
         ]
      },
   }
   ])

   return res.status(200)
   .json(
      new ApiResponse(200,
         user[0].watchHistory,
         "Watch history fetched successfully!"
      )
   )
 });

export {registerUser, loginUser, logoutUser, regenerateAccessToken, changePassword, getCurrentUser, updateUserProfile, updateAvatar, updateCoverImage, userChannelProfile, watchHistory}