const express = require('express');
const router = express.Router();
const User = require('../models/userAuthModel');
const UserWithDocs = require('../models/userAuthWithDocuments');
const geoData = require('../models/geologicalLoginData');
const usedPasswords = require('../models/usedPasswords');
const {body, validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fetchuser = require('../middleware/fetchuser');
const distanceCalculator = require('../middleware/distanceCalculator');
const getLocationFromIp = require('../middleware/getLocationFromIp');
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET_USER;
/**
 * api-endpoint                    duty
 *  /                             login
 *  /validateMail                 checks for temp mails
 *  /validatePassword             checks the usage of common passwords
 *  /signup                       new user registration
 *  /getUser                      get user details except password, updates the last time the account details was
 *                                accessed
 *  /geoCheck                     checks for any suspicious login activities, should be paired with login to get
 *                                proper geological data of user during login process, run
 * 
 */




const createUserLocationData = async (email, ipAddress) => {
  try {
    // Check if the user's data exists in UserLocationDuringLogin
    let userLocationData = await geoData.findOne({ email });
    let locationData = await getLocationFromIp(ipAddress)
    console.log(email);
    if (!userLocationData) {
      // Create initial data in UserLocationDuringLogin
      userLocationData = new geoData({
        email,
        ipInfo: ipAddress, // Replace with the actual initial IP info
        flags: "passed", // Replace with the actual initial flag
        timeDifferenceBetweenLastAndCurrentSession: "0",
        lastCity:"firstLogin",
        currentCity:locationData.city,
        latitude:parseFloat(locationData.loc.split(',')[0]),
        longitude: parseFloat(locationData.loc.split(',')[1]),
        DistanceBetweenTwoCoordinates: Math.abs(distanceCalculator(parseFloat(locationData.loc.split(',')[0]),parseFloat(locationData.loc.split(',')[1]),0,0)),
      });

      userLocationData.date = Date.now();

      await userLocationData.save();
    }
    else{
      updateUserDetailsAndCalculateTimeDifferenceAndIp(email, ipAddress);
    }
  } catch (error) {
    console.error('Error creating or updating user location data:', error);
  }
};

async function updateUserDetailsAndCalculateTimeDifference(email) {
  try {
    // Fetch user details
    const user = await geoData.findOne({ email });
    console.log(email);
    if (user) {
      // Update date to current time
     

      // Calculate time difference
      const lastSessionTime = user.date.getTime();
      const currentTime = Date.now();
      const timeDifferenceInSeconds = Math.abs(currentTime - lastSessionTime) / 1000;

      // Convert seconds to hours, minutes, and seconds
      const hours = Math.floor(timeDifferenceInSeconds / 3600);
      const minutes = Math.floor((timeDifferenceInSeconds % 3600) / 60);
      const seconds = Math.floor(timeDifferenceInSeconds % 60);

      // Update timeDifferenceBetweenLastAndCurrentSession field
      user.date = Date.now();
      user.timeDifferenceBetweenLastAndCurrentSession = `${hours}h ${minutes}m ${seconds}s`;

   
      // Save the updated user details
      await user.save();

      console.log('User details updated successfully.');
    } else {
      console.log('User not found.');
    }
  } catch (error) {
    console.error('Error updating user details:', error);
  }
}

async function updateUserDetailsAndCalculateTimeDifferenceAndIp(email, ipAddress) {
  try {
    // Fetch user details
    const user = await geoData.findOne({ email });
    let locationData = await getLocationFromIp(ipAddress)
    if (user) {
      // Calculate time difference
      const lastSessionTime = user.date.getTime();
      const currentTime = Date.now();
      const timeDifferenceInSeconds = Math.abs(currentTime - lastSessionTime) / 1000;

      // Convert seconds to hours, minutes, and seconds
      const hours = Math.floor(timeDifferenceInSeconds / 3600);
      const minutes = Math.floor((timeDifferenceInSeconds % 3600) / 60);
      const seconds = Math.floor(timeDifferenceInSeconds % 60);

      // Update timeDifferenceBetweenLastAndCurrentSession field
      user.ipInfo = ipAddress;
      user.date = Date.now();
      user.lastCity = user.currentCity;
      user.currentCity = locationData.city;
      user.timeDifferenceBetweenLastAndCurrentSession = `${hours}h ${minutes}m ${seconds}s`;
      user.DistanceBetweenTwoCoordinates = Math.abs(distanceCalculator(parseFloat(locationData.loc.split(',')[0]),parseFloat(locationData.loc.split(',')[1]),user.latitude,user.longitude));
      user.latitude = parseFloat(locationData.loc.split(',')[0]);
      user.longitude = parseFloat(locationData.loc.split(',')[1]);
      console.log(user.timeDifferenceBetweenLastAndCurrentSession);
      // Save the updated user details
      await user.save();

      console.log('User details updated successfully.');
    } else {
      console.log('User not found.');
    }
  } catch (error) {
    console.error('Error updating user details:', error);
  }
}

router.post('/',[body('email','Enter a valid mail').isEmail(),
body('password','Password cannot be blank').exists()], async (req,res)=>{
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(400).json({errors: errors.array()});
  }

  const {email, password, ipAddress} = req.body;
  try {
      let user = await User.findOne({email});
      if(!user){
        return res.status(400).json({error: "Please try to login with different credentials!"});
      }

      const pwdCompare = await bcrypt.compare(password, user.password);
      if(!pwdCompare){
        return res.status(400).json({error: "Please try to login with different credentials!"});
      }

      const data={
        user:
       {
         id: user.id
       }
     }
     const authtoken = jwt.sign(data, JWT_SECRET);
     createUserLocationData(email, ipAddress);
     res.json({authtoken,success:true});
  } catch (error) {
    console.error(error.message);
    res.status(500).json({error: "Internal server error"});
  }
});

router.post('/validateMail',async (req, res)=>{
  const {email} = req.body;
  //abstract api verification
  const apiKey = process.env.API_KEY_ABSTRACT_API;

  try {
    const response = await fetch(`https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${email}`, {
      method: 'GET'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error('Fetch error:', error);
  }
});



router.post('/validatePassword', async (req, res) => {
  const { email, password } = req.body;

  function isCommonPassword(password, email) {
    // Common passwords list
    const commonPasswords =["password","password1","password12","password012","password123", "password0123",
    "password1234", "password01234","password12345", "password012345"];

    // Extract username from email (assuming email is in the format username@example.com)
    const username = email.match(/^([^@]+)@/) ? email.match(/^([^@]+)@/)[1] : null;

    // Check if password is common or follows a certain pattern
    if (
      commonPasswords.includes(password) ||
      (username && password.includes(username)) ||
      doesPasswordFollowPattern(password, username) ||
      doesPasswordFollowEmailPattern(password, email)
    ) {
      return true;
    } else {
      return false;
    }
  }

  // Function to check if password follows a certain pattern
  function doesPasswordFollowPattern(password, username) {
    // Check if password is obtained by adding or subtracting certain numbers to all digits in the email identifier
    if (username) {
      const digitPattern = /\d/g;
      const usernameDigits = username.match(digitPattern);
      if (usernameDigits) {
        for (let i = 1; i <= 9; i++) {
          const modifiedPasswordAdd = username.replace(digitPattern, (match) => {
            const digit = parseInt(match);
            return ((digit + i) % 10).toString(); // Adding i to each digit and wrapping around to 0 if it becomes 10
          });

          const modifiedPasswordSubtract = username.replace(digitPattern, (match) => {
            const digit = parseInt(match);
            const modifiedDigit = (digit - i + 10) % 10;
            return modifiedDigit.toString(); // Convert modified digit to string
          });

          if (modifiedPasswordAdd === password || modifiedPasswordSubtract === password) {
            return true;
          }
        }
      }
    }

    return false;
  }

  // Function to check if password follows a certain email pattern
  function doesPasswordFollowEmailPattern(password, email) {
    // Check if password includes common patterns based on email
    const emailPrefix = email.split('@')[0];

    // Successive patterns like 1, 12, 123, ..., 1234567890
    for (let i = 1; i <= 10; i++) {
      const successivePattern = Array.from({ length: i }, (_, index) => emailPrefix.slice(0, index + 1));
      if (successivePattern.some(pattern => password.includes(pattern))) {
        return true;
      }
    }

    // Split digit and alphabet portion and check
    const splitPassword = password.match(/([a-zA-Z]+)([0-9]+)/);
    if (splitPassword) {
      const [, alphabetPart, digitPart] = splitPassword;
      if (emailPrefix.includes(alphabetPart) && emailPrefix.includes(digitPart)) {
        return true;
      }
    }

    return false;
  }

  if (isCommonPassword(password, email)) {
    res.status(400).json({ error: "Password rejected. Choose a stronger password." });
  } else {
    res.status(200).json({ success: "Password accepted. Welcome!" });
  }
});

router.post('/signup', [
  body('email', 'Enter a valid mail').isEmail(),
  body('phoneNumber', 'Enter a valid phone number').isLength({ min: 10 }),
  body('address', "Enter a valid address").isLength({ min: 6 }),
  body('name', "Name must be at least 3 characters").isLength({ min: 3 }),
  body('password', 'Password must be at least 8 characters').isLength({ min: 8 })
], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    let user = await User.findOne({ email: req.body.email });
    if (user) {
      return res.status(400).json({ error: "Email already exists!" })
    }

    async function isPasswordInOldPasswords(email, hashedPassword) {
      const user = await usedPasswords.findOne({ email, passwords: { $elemMatch: { $eq: hashedPassword } } });
      return user !== null;
    }

    const salt = await bcrypt.genSalt(10);
    const securePassword = await bcrypt.hash(req.body.password, salt);

    const isPasswordDuplicate = await isPasswordInOldPasswords(req.body.email, securePassword);

    if (isPasswordDuplicate) {
      return res.status(400).json({ error: "Password rejected. Choose a different password." });
    } else {
      const oldPasswordData = await usedPasswords.findOne({ email: req.body.email });

      if (oldPasswordData) {
        await usedPasswords.findOneAndUpdate({ email: req.body.email }, { $push: { passwords: securePassword } });
      } else {
        await usedPasswords.create({ email: req.body.email, passwords: [securePassword] });
      }
    }

    user = await User.create({
      name: req.body.name,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
      password: securePassword
    });

    const data = {
      user: {
        id: user.id
      }
    }

    const authtoken = jwt.sign(data, JWT_SECRET);
    res.json({success: true });

  } catch (error) {
    console.error(error.message);
    res.json({ error: "Internal server error during admin login" });
  }
});


router.get('/getuser' ,fetchuser, async (req,res)=>{
  try{
    let userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    updateUserDetailsAndCalculateTimeDifference(user.email)

    if(user){
      res.send(user);
    }
    else{
      res.send({"error":"no such user exists"});
    }
      
  }
  catch (error) {
    console.error(error.message);
    res.status(500).json({error: "Internal server error"});
  }
});

router.post('/updateUser',fetchuser, async (req,res)=>{
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(400).json({errors: errors.array()});
  }
  const {email, name, phoneNumber, address} = req.body;
  try {
    const updatedUser ={};
    if(name){updatedUser.name = name};
    if(phoneNumber){updatedUser.phoneNumber= phoneNumber};
    if(address){updatedUser.address= address};
    
    let updatedResponse = await User.findByIdAndUpdate(req.user.id,{$set: updatedUser},{new:true}).select("-password");
    res.send(updatedResponse);

  } catch (error) {
    console.error(error.message);
    res.json({error:"Internal server error during admin login"})
  }
});




module.exports = router;