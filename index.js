//jshint esversion:6
const express = require('express');
const port = process.env.PORT || 3000;
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();
// Path module is used whenever working with Directories and Files
const path = require('path')
const lectureNote = require('./models/LectureDetails');
const app = express();
const instructorModel = require('./models/InstructorDetails');
const bcrypt = require('bcrypt');
const multer=require('multer');
const query  = require("./models/query");
const request = require('request');
//fs is also used whenever you need to work with files on your computer.
const fs =  require('fs')
var isInstructorAuthenticated = false;
var InstructorMail = '';
var mailer = require('nodemailer');
var threeModelsArray = []
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// using middlewares 

/**Have to understand below part */
app.use(bodyParser.json({ limit: '10mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname + '/../public')));
app.use(express.static('public'));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});


//Defining storage engine for multer, It adds body object and file/files object to req body. The body object contains the values of the text fields of the form, the file or files object contains the files uploaded via the form
//It can only be used for multipart/form-data
//What is multipart/form-data, Basically it is a type of encoding used with req while making a post request, This type of encoding is used when u are inputting a file else, u can use application/x-www-form-data which is also default in enctype
var storage=multer.diskStorage({
  //req contains information of request, File contains some additional information about file then callback is decided to send data to a parameter. 
  destination:(req,file,cb)=>{
    cb(null,__dirname+'/public/assets/models/glb')
  },
  filename:(req,file,cb)=>{
    cb(null,file.originalname)
  }
});


//upload is used to pass as a second parameter,In a post request
var upload=multer({
  storage:storage
});


// connecting out map with mongodb atlas 
mongoose
  .connect(process.env.mongooseuri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('connected');
  })
  .catch((err) => {
    console.log('not connected');
  });



// this function help us to make a random string of n length
function makeid(length) {
  var result = '';
  var characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

// this will sort all lecture subject wise
dynamicSort=function(property) 
   {
     var sortOrder = 1;
     if(property[0] === "-") 
     {
         sortOrder = -1;
         property = property.substr(1);
    } 
       return function (a,b) { 
           if(sortOrder == -1){
               return b[property].localeCompare(a[property]);
           }else{ 
               return a[property].localeCompare(b[property]); } 
           }
  }

convertTo2d=function(doc) {
      var arrlen =1 ;
      for(var i=0;i<doc.length-1;i++){
      if(doc[i].subject_name != doc[i+1].subject_name){
        arrlen++;
      }
     } 
     let arr = new Array(arrlen +1);   
      for(let i=0;i<(arrlen+1);i++){
        arr[i] = [];
      }
      arrlen =0; 
      arr[0].push(doc[0]);
       let j=0;
       for(let i=1;i<doc.length;i++) {
           if(doc[i-1].subject_name===doc[i].subject_name) {
               arr[j].push(doc[i]);
           }
           else {
               j++;
               arr[j].push(doc[i]);
           }
       }
       return arr;
   }

checksubject=function(value) {
if(value.toLowerCase()==="physics")
return "physics";
if(value.toLowerCase()==="chemistry")
return "chemistry";
if(value.toLowerCase()==="math"||value.toLowerCase()==="mathematics"||value.toLowerCase()==="maths")
return "maths";
if(value.toLowerCase()==="biology")
return "biology";
return "";
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/sign-in', (req, res) => {
    res.render('sign-in', {auth:true});
});

app.get('/contribute',(req,res)=>{
  res.render('contribute',{});
})

app.get('/',(req,res)=>{
  res.render('frontpage',{});
})

app.post('/contribute',upload.single('modelTesting'),(req,res)=>{
  res.render('thankyou',{})
})

//Adding in last ,so that it runs if we don't have given that path or some other file, req.params.id gives basically path ,i.e. after /
app.get("/model/:id",(req,res)=>{
  if(req.params.id!="null")
  res.render('showmodels1',{name:req.params.id});
  else
  res.render('notfound',{});
})


// setted post route checking for correct instructor login 
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

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get("/dashboard/generate",(req,res)=>{
    res.render('Generator',{action:"notdone"});
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// this will lecture forming request
// fortestin purpose you can use below lecture id 
var currentLectureId = "";
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


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/admin-panel', (req, res, next) => {
    res.render('admin-login', {auth:true});
});

//* Adding get request path for Team Page
app.get("/team",(req,res)=>{
  res.render('team',{})
});
app.get("/about",(req,res)=>{
  res.render('why_us',{})
})

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// this post route will take data provided by admin and save it as a instructor credentials 
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
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// rendering lecture created by particular instructor 
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
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//set get route for rendering all added lecture from where student can access them  
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

  //serving lecture page 
var insdbtmail = '';
var lecture_id = '';
var i=0;
// use ti get lecture using lecture id as it will be passed as params of request
app.get('/lecture/:id', (req, res, next) => {
  // i = i+1;
  // console.log(i)
  lectureNote
    .find({ lecture_id: req.params.id })
    .then((doc) => {
      console.log(doc)
      insdbtmail = doc[0].InsEmail;
      lecture_id = doc[0].lecture_id;
      var arr = [];
      res.render('lecture', {
        lecture_title: doc[0].title,
        lecture_para: doc[0].para.replace(/["]+/g, "'"),
        note: doc[0].additional_note,
        src: doc[0].video_link,
        reso: doc[0].resources,
        id: doc[0].lecture_id,
        model_name: doc[0].model
        // models_length: Object.keys(arr).length

      });
    })
    .catch((err) => console.log('error aagayi bhai',err));
});

app.get('/instructor/lecture/:id', (req, res, next) => {
  // i = i+1;
  // console.log(i)
  lectureNote
    .find({ lecture_id: req.params.id })
    .then((doc) => {
      console.log(doc)
      insdbtmail = doc[0].InsEmail;
      lecture_id = doc[0].lecture_id;
      var arr = [];
      res.render('instructorlecture', {
        lecture_title: doc[0].title,
        lecture_para: doc[0].para.replace(/["]+/g, "'"),
        note: doc[0].additional_note,
        src: doc[0].video_link,
        reso: doc[0].resources,
        id: doc[0].lecture_id,
        model_name: doc[0].model
        // models_length: Object.keys(arr).length

      });
    })
    .catch((err) => console.log('error aagayi bhai',err));
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
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// basically this route will help us to validate if admin is login in or not 
app.post('/admin-login', (req, res, next) => {
    var adminEmail = req.body.usremail;
    var adminPassword = req.body.usrpsw;
    console.log(req.body)
    if (adminEmail === process.env.adminmail && adminPassword === process.env.adminpassword) {
      res.render('admin-panel', {});
    } else {
    //   var userVerified = false;
      res.render('admin-login', {auth:false});
    }
});

//* Adding get request path for Team Page
app.get("/team",(req,res)=>{
  res.render('team',{})
});

//temporary route to display success page
app.get("/success",(req,res)=>{
  res.render('Success',{})
})

//this route will handle all delete request
app.get("/dashboard/del/:id",(req,res,next)=>{
  lectureNote.remove({lecture_id:req.params.id}, function(err, result) {
    if (err) {
      console.err(err);
    } else {
      res.redirect('/dashboard')
      // redirect to all lecture route when using webui to delete cards fastly
    }
  });
})

//handling query delete request 
app.get("/dashboard/:id",(req,res)=>{
  query.remove({query_id:req.params.id}, function(err, result) {
    if (err) {
      console.err(err);
    } else {
      res.redirect('/dashboard')
      // redirect to all lecture route when using webui to delete cards fastly
    }
  });
})



//handing doubt request 
app.post("/query",async (req,res)=>{
  //insdbtmail : insturctor to whom we send raised dbt
  var query_id = await makeid(6);
  
  var nowDate = new Date(); 
  var date = nowDate.getFullYear()+'/'+(nowDate.getMonth()+1)+'/'+nowDate.getDate(); 
  var doubt = `<h3>Student ${req.body.name} asked this doubt</h3><br><p>${req.body.query}</p><br><p>Reply this mail to ${req.body.email}</p>`;
  let doubt_data = new query({
    InstructorEmail: insdbtmail,
    name: req.body.name,
    query_text: req.body.query,
    student_mail : req.body.email,
    date: date,
    query_id: query_id
  })
  var sampleObj  = await doubt_data.save()
  .then((doc)=>{
    console.log("doubt saved",doc)
  })
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
    to: insdbtmail,
    subject: 'Doubt raised for your lecture',
    html: doubt,
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
  res.redirect(`/lecture/${lecture_id}`);
});

//below routes handle updating lecture feature
app.get("/dashboard/edit/:id",(req,res,next)=>{
  lectureNote.find({lecture_id:req.params.id}).then((value)=>{
    console.log("ye data hai",value)
    value[0].quillDelta = ""
    res.render('edit_generator',{value:value});
  }).catch((err)=>{
    console.log(err);
  })
  
});

app.post("/edit/:id",async (req,res,next)=>{
  console.log(req.body);
  const filter = {lecture_id: req.params.id}
  const update = {
    InsEmail: req.body.Insemail,
    title: req.body.ltitle,
    para : req.body.value,
    additional_note: req.body.note,
    video_link: req.body.video_url,
    subject_name: req.body.subject_name
    // model: req.body.model
  }
  console.log(update)
  var updatedData = await lectureNote.findOneAndUpdate(filter, update, {
    new: true
  });
  console.log("ye updated data hai",updatedData);
})


app.get("/customodel/:id",(req,res)=>{
  console.log("sahi call hua ",req.params.id)
  if(req.params.id!="null")
  res.render('showmodel',{name:req.params.id,is_custom_model:"custom_model"});
  else
  res.render('notfound',{});
})

app.post("/custom/uploadmodel",upload.single('modelTesting'),(req,res,next)=>{
  res.redirect("/dashboard/generate/add-model")
});
// res.render('showmodels1',{name:req.file.originalname})
// serving application 
app.listen(port, () => {
    console.log('Server Started at ' + port);
});
  