const mongoose = require("mongoose")

let lectureNotes = new mongoose.Schema({
    InsEmail:{type:String,default:null},
    lecture_id:{type:String,default:null},
    title:{type:String,default:null},
    para :{type:String,default:null},
    additional_note:{type:String,default:null},
    video_link:{type:String,default:null},
    resources:{type:String,default:null},
    subject_name:{type:String,default:null},
    model:[String],
    quillDelta:{type:String,default:null}
    // customModelName:{type:String,default:null}
})

module.exports = mongoose.model('LectureNote',lectureNotes);