const express=require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const port = process.env.PORT || 3000;
const bcrypt=require('bcrypt');
const path = require('path');
const app = express();
const logger = require('morgan')
var isInstructorAuthenticated = false;
var InstructorMail = '';
const query  = require("./models/query");
const lectureNote = require('./models/LectureDetails');
const instructorModel = require('./models/InstructorDetails');
const multer=require('multer');
const request = require('request');
const fs =  require('fs')

var isInstructorAuthenticated = false;
var InstructorMail = '';
var mailer = require('nodemailer');
var threeModelsArray = []

app.use(bodyParser.json({ limit: '10mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(express.json());
app.use(logger('dev'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname + '/../public')));
app.use(express.static('public'));




mongoose
  .connect('mongodb+srv://creator:nnNN@@22@cluster0.bkrcv.mongodb.net/Images', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('connected');
  })
  .catch((err) => {
    console.log('not connected');
  });


app.get("/",(req,res)=>{
    res.render('frontpage',{});
})

app.get('/admin-panel', (req, res, next) => {
    res.render('admin-login', {auth:true});
});

app.post('/admin-login', (req, res, next) => {
    var adminEmail = req.body.usremail;
    var adminPassword = req.body.usrpsw;
    console.log(req.body)
    if (adminEmail === 'nlok5923@gmail.com' && adminPassword === '123') {
      res.render('admin-panel', {});
    } else {
    //   var userVerified = false;
      res.render('admin-login', {auth:false});
    }
});


app.post('/admin-login', (req, res, next) => {
    var adminEmail = req.body.usremail;
    var adminPassword = req.body.usrpsw;
    console.log(req.body)
    if (adminEmail === 'nlok5923@gmail.com' && adminPassword === '123') {
      res.render('admin-panel', {});
    } else {
    //   var userVerified = false;
      res.render('admin-login', {auth:false});
    }
});


//* Code for POst request for Admin Panel
app.post('/admin-panel', async (req, res, next) => {
    const InstructorPassword = req.body.psw;
    const rounds = 10;
    var hashedPassword = '';
    var ob1;
    // the password created is being hashed using bcrypt to maintain data privacy
    ob1 = await bcrypt.hash(InstructorPassword, rounds, (err, hash) => {
      if (err) {
        console.log(err);
        return;
      }
      hashedPassword = hash;
      let InsDetails = new instructorModel({
        first_name: req.body.fname,
        last_name: req.body.lname,
        email: req.body.usremail,
        password: hashedPassword,
      });
      InsDetails.save()
        .then((doc) => {
         // A transporter has been defined which is using nodemailer to mail the particular person who is appointed as instructor 
          var InformMail = `Dear Sir/Ma'am, <br> Thanks for using our service and helping us to provide materials in the most efficient way as possible to deliver your precious lecture content to student we TechAr service appointed you as a instuctor at service TechAr your credentials are as follows.<br>
             id: ${req.body.usremail}<br>password: ${req.body.psw} <br><br><br> Thanks and Regards <br>TechAr`;
          var transporter = mailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            service: 'gmail',
            auth: {
              user: 'techar.service@gmail.com',
              pass: 'TechAr@9907',
            },
          });
  
          var mailOptions = {
            from: 'techar.service@gmail.com',
            to: req.body.usremail,
            subject: 'Appointed as instructor at tecahAr',
            html: InformMail,
          };
  
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' + info.response);
            }
          });
        })
        .catch((err) => {
          console.log('error : ', err);
        });
    });
    res.render('frontpage', {});
  });
  /////
app.get('/sign-in', (req, res) => {
    res.render('sign-in', {auth:true});
});

app.post('/sign-in', async (req, resp, next) => {
  var usrEmail = req.body.usremail;
  var temp;
  //* Instructor Model is basically a model 
  temp = await instructorModel
    .find({ email: usrEmail })
    .then(async (doc) => {
      if(doc.length !=0){
      var ob1;
      ob1 = await bcrypt.compare(
        req.body.usrpsw,
        doc[0].password,
        (err, res) => {
          if (err) {
            resp.render('sign-in', {auth: false});
            console.error(err);
            return;
          }
          
          InstructorMail = req.body.usremail;
          isInstructorAuthenticated = res;
          if(res){
          resp.redirect("/dashboard")
          }
          else{
          resp.render('sign-in', {auth: false});
          }
        }
      );
      }else{
        resp.render('sign-in', {auth: false});
      }
    })
    .catch((err) => {
      console.log('error finding user', err);
    });
});

app.get("/dashboard/generate",(req,res)=>{
  res.render('Generator',{action:"notdone"});
})

//* Adding Code for Post request for Dashboard
var currentLectureId = "dNOJPz";
// var currentLectureId = "";
app.post('/dashboard/generate',async (req, res, next) => {

  console.log("Printing request body",req.body);
  var id = await makeid(6);
  currentLectureId = id;
  let Mail = req.body.Insemail;
  let lectureid = id;
  let lecture_title = req.body.ltitle;
  let lecture_para = req.body.value;
  let lecture_additional_note = req.body.note;
  let lecture_video_link = req.body.video_url;
  let lecture_reso = req.body.extras;
  let lecture_subject = req.body.subject_name;
  let model_name = req.body.model;
  // let customModelName = req.body.filename;

  let lectureData = new lectureNote({
    InsEmail: Mail,
    lecture_id: lectureid,
    title: lecture_title,
    para: lecture_para,
    additional_note: lecture_additional_note,
    video_link: lecture_video_link,
    resources: lecture_reso,
    subject_name: lecture_subject
    // model: model_name,
    // customModelName: customModelName
  });
  var ob1 = await lectureData
    .save()
    .then((doc) => {
      console.log(doc);

      //* Below thing is for sending mail only 
      var emailData = `Dear Instructor <br> you can take a preview of your lecture content at https://tech-ar.herokuapp.com/${id} <br><br><br> Thanks and Regards<br> techAr services`;
      console.log('data saved successfully', doc.lecture_id);
      // Defining transporter to send mail to the instructor with lecture link once lecture is created
      var transporter = mailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        service: 'gmail',
        auth: {
          user: 'techar.service@gmail.com',
          pass: 'TechAr@9907',
        },
      });

      var mailOptions = {
        from: 'techar.service@gmail.com',
        to: req.body.Insemail,
        subject: 'Your lecture is live',
        html: emailData,
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
    })
    .catch((err) => {
      console.log('error occur', err);
    });
});

app.get("/dashboard/generate/add-model",async (req,resp)=>{
  var model__array = [];
    await request('https://console.echoar.xyz/query?key=holy-dust-4782', { json: true }, (err, res, body) => {
    if (err) { return console.log(err); }
    var id = Object.values(body.db)
    console.log(id.length)
    id.map((data)=>{ model__array.push({model__url: data.additionalData.shortURL, model__name:data.hologram.filename.split('.').slice(0, -1).join('.')})})
    model__array.map((data)=>console.log(data))
    const directoryname=__dirname+'/public/assets/models/glb';
    console.log(directoryname);
    fs.readdir(directoryname,async (err,files)=>{
      if(err){
        console.log('Error finding the directory')
        resp.render('notfound',{})
      }else{
        files.map((file)=>{
          var value=file;
          threeModelsArray.push(value.split('.').slice(0, -1).join('.'));
          console.log(value);
        })
    console.log(threeModelsArray)
    resp.render("models",{lecture_id: currentLectureId, model:model__array, three__models: threeModelsArray})
    threeModelsArray.splice(0,threeModelsArray.length)
      }
    });
    // console.log(threeModelsArray)
    // resp.render("models",{lecture_id: currentLectureId, model:model__array, three__models: threeModelsArray})
    // threeModelsArray.splice(0,threeModelsArray.length)
  });
  console.log(model__array)
});



app.post("/dashboard/generate/add-model",async (req,res)=>{
  console.log(req.body);
  const filter = {lecture_id: req.body.lecture_id}
  const update = {model: req.body.models_array}
  console.log(update)
  var updatedData = await lectureNote.findOneAndUpdate(filter, update, {
    new: true
  });
  console.log(updatedData);

})

// get request for providing all lecture information
app.get("/all-lecture",(req,res)=>{
  lectureNote.find().then( async (doc)=>{
    let i=0;
    await doc.map((data,key)=>{
      if(data.subject_name != null)
      data.subject_name = data.subject_name.toLowerCase();
      
    })
    // await doc.filter(redundantLectures);
    let finalDoc = doc.filter(function(e){
      return e.subject_name!=null 
    })
    finalDoc.sort(dynamicSort("subject_name"))
    
    var arrlen =0 ;
    for(var j=0;j<finalDoc.length-1;j++){
      if(finalDoc[j].subject_name != finalDoc[j+1].subject_name){
        arrlen++;
      }
    } 
  
    var arr = new Array(arrlen+1);
    for(let i=0;i<(arrlen+1);i++){
      arr[i] =[];
    }
    arrlen =0 ;
     arr=convertTo2d(finalDoc)
     
     res.render('lectures',{lectureArray:arr, length:arr.length,mail: null,checksubject:checksubject})
  }).catch((err)=>console.log("error finding records",err))
});

//* Adding Code for Get Request for Dashboard
app.get('/dashboard', (req, res) => {
    lectureNote
      .find({ InsEmail: InstructorMail })
      .then((doc) => {
        query.find({InstructorEmail: InstructorMail})
        .then((doc_2)=>{
           res.render('dashboard',{doc, length: doc.length ,mail: InstructorMail, queries: doc_2, queries_length: doc_2.length});
        })
      })
      .catch((err) => console.log('error finding records',err));
  });




app.listen(port,(req,res)=>{
    console.log('Started listening at',port);
});