const mongoose = require("mongoose")

let queries = new mongoose.Schema({
    InstructorEmail:{type:String,default:null},
    name:{type:String,default:null},
    query_text:{type:String,default:null},
    student_mail :{type:String,default:null},
    date: {type:String, default:null},
    query_id: {type:String, default:null}

})

module.exports = mongoose.model('Query',queries);