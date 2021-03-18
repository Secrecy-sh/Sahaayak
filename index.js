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

app.get('/sign-in', (req, res) => {
    res.render('sign-in', {auth:true});
});

app.listen(port,(req,res)=>{
    console.log('Started listening at',port);
});