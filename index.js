const express=require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const port = process.env.PORT || 3000;
const bcrypt=require('bcrypt');
const path = require('path');
const app = express();
const logger = require('morgan')
//* Mongo Db Model for Instructor
var mailer=require('nodemailer');
const instructorModel = require('./models/InstructorDetails');
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