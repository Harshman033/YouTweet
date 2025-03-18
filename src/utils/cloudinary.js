import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async function (localFilePath){
   try {
    if(!localFilePath) return null;
    const uploadResult = await cloudinary.uploader
    .upload(
       localFilePath, {
            resource_type : 'auto'
        }
    )

    if(uploadResult){
     console.log("upload to cloudinary successful", uploadResult);
     return uploadResult
    }
   } catch (error) {
    fs.unlinkSync(localFilePath)
    console.log("cloudinary upload error", error);
    return null;
   }
   
}

export {uploadOnCloudinary};