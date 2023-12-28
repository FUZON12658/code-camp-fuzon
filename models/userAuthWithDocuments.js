const mongoose = require('mongoose');
const {Schema} = mongoose;

const userWithDocsSchema = new Schema({
  name:{
    type: String,
    required: true
  },
  email:{
    type:String,
    required: true,
    unique: true
  },
  phoneNumber:{
    type: Number,
    required: true,
    unique: true
  },
  password:{
    type: String,
    required: true
  },
  images:[{type: String}],
  date:{
    type:Date,
    default: Date.now
  }
});

const UserWithDocs = mongoose.model('userWithDocuments',userWithDocsSchema);
UserWithDocs.createIndexes();
module.exports = UserWithDocs;