const mongoose = require('mongoose');
const {Schema} = mongoose;

const loginLocationSchema = new Schema({
  email:{
    type:String,
    required: true,
    unique: true
  },
  ipInfo:{
    type: String,
    required: true,
  },
  flags:{
    type: String,
    enum: ["suspicious","passed","locked"],
    required: true,
  },
  date:{
    type:Date,
    default: Date.now
  },
  timeDifferenceBetweenLastAndCurrentSession:{
    type: String,
    required: true,
  },
  lastCity:{
    type:String,
    required: true,
  },
  currentCity:{
    type:String,
    required: true,
  },
  latitude:{
    type:Number,
    required: true,
  },
  longitude:{
    type:Number,
    required: true,
  },
  DistanceBetweenTwoCoordinates:{
    type: Number,
    required: true
  }
});

const UserLocationDuringLogin = mongoose.model('userLocationDuringLogin', loginLocationSchema);
UserLocationDuringLogin.createIndexes();
module.exports = UserLocationDuringLogin;