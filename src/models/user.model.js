import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const UserSchema  = new mongoose.Schema({

watchHistory : {
    type : mongoose.Schema.Types.ObjectId,
    ref : 'Video'
    
},
username : {
    type : String,
    required : true,
    unique : true,
    trim : true, 
    lowercase : true,
    index : true  //makes it easy to search 
},
email : {
    type : String,
    required : true,
    unique : true,
    trim : true, 
    lowercase : true,
},
fullName : {
    type : String,
    required : true,
    trim : true,
    index : true 
},
avatar : {
    type : String, //cloudinary url
    required : true
},
coverImage : {
    type : String,
    //required : true
},
password : {
    type : String,
    required : [true, 'Password is required']
},
refreshToken : {
    type : String
}
}, {timestamps: true});

UserSchema.pre('save', async function (next){
    if(!this.isModified('password')) return next()
    this.password = await bcrypt.hash(this.password, 10)
    next()
});

UserSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

UserSchema.methods.generateAccessToken = function (){
return jwt.sign(
    {
      _id : this._id,
      email : this.email,
      username : this.username,
      fullName : this.fullName
      
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
    expiresIn : process.env.ACCESS_TOKEN_EXPIRY
    }

)
}

UserSchema.methods.generateRefreshToken = async function (){
    return jwt.sign(
        {
          _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
        expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    
    )
}

export const User = mongoose.model('User', UserSchema)