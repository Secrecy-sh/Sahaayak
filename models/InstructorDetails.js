const mongoose = require("mongoose")

let instructorDetails = new mongoose.Schema({
    first_name:{type:String,default:null},
    last_name :{type:String,default:null},
    email:{type:String,default:null},
    password:{type:String,default:null}
})

module.exports = mongoose.model('instructorDetails',instructorDetails);