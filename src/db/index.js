import mongoose from 'mongoose'
import {DB_NAME} from '../constants.js'

const dbConnect = async ()=>{
    try{
         const dbConnectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
         console.log(`database connection successful, DB HOST : ${dbConnectionInstance.connection.host}` )
        
    }catch(error){
      console.log("Error in connecting db: ", error);
      process.exit(1);
    }
}

export default dbConnect;