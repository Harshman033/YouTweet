import mongoose from 'mongoose'
import {DB_NAME} from '../constants.js'

const dbConnect = async ()=>{
    try{
      console.log(`Final connection string: ${process.env.MONGODB_URL}/${DB_NAME}`);
         const dbConnectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
         console.log(`database connection successful, DB HOST : ${dbConnectionInstance.connection.host}` )
        
    }catch(error){
      console.error(" MongoDB Connection Failed:", error.message);
      console.error("Full Error Details:", error);
      process.exit(1);
    }
}

export default dbConnect;