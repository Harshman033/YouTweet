import dotenv from 'dotenv';
import dbConnect from "./db/index.js";
import app from './app.js'


dotenv.config({
    paths : './env'
});

dbConnect()
.then(()=>{
    app.listen(process.env.PORT||8080, ()=>{
        console.log("listening on port: ", process.env.PORT||8080);
    })
    app.on('error', (error)=>{
        console.log("error on listening to the port: ", error);
        throw error
    })
})
.catch((error)=>{
    console.log("error on connecting db: ", error)
})