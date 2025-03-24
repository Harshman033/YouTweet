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
    fs.unlinkSync(localFilePath)
     return uploadResult
    
   } catch (error) {
    fs.unlinkSync(localFilePath)
    return null;
   }
   
}

const deleteFromCloudinary = async function(url){
    try {
        if(!url){
            return null
        }
       const publicIdWithExtension =  url.split('/').pop();
       const publicId = publicIdWithExtension.substring(0, publicIdWithExtension.lastIndexOf('.'));
    const deleteResult = await cloudinary.uploader.destroy(publicId)
    return deleteResult;
    } catch (error) {
        console.log(error?.message || "something went wrong while deleting the file from cloudinary ");
        return null;
    }
}

export {uploadOnCloudinary, deleteFromCloudinary};