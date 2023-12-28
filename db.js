const mongoose = require('mongoose');
const mongoURI = "mongodb://127.0.0.1:27017/code-camp?directConnection=true";


const connectToMongo = () =>{
  mongoose.connect(mongoURI). then(()=>{
    console.log("connected to mongo successfully");
  }).catch((e)=>console.log(e.message));
};

module.exports = connectToMongo;