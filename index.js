const express=require('express');
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000;
const path = require('path');
const app = express();
const logger = require('morgan')

app.use(bodyParser.json({ limit: '10mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(express.json());
app.use(logger('dev'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname + '/../public')));
app.use(express.static('public'));

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

app.get('/sign-in', (req, res) => {
    res.render('sign-in', {auth:true});
});

app.listen(port,(req,res)=>{
    console.log('Started listening at',port);
});