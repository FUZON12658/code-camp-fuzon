const mongoose = require('mongoose');
const {Schema} = mongoose;

const oldPasswordsSchema = new Schema({
  email:{
    type: String,
    required: true,
    unique: true,
  },
  passwords:[
    {type:String}
  ],
  date:{
    type: Date,
    default: Date.now
  }
});

const oldPasswords = mongoose.model('oldPasswords', oldPasswordsSchema);
oldPasswords.createIndexes();
module.exports = oldPasswords;
