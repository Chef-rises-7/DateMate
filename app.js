const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyP = require('body-parser');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const saltRounds = 10;

app.set('view engine','ejs');
app.use(express.static('public'));
app.use(bodyP.urlencoded({extended: true}));
mongoose.connect("mongodb://localhost:27017/PersonDB",{ useNewUrlParser: true,useUnifiedTopology: true });

const Storage = multer.diskStorage({
    destination: "./public/uploads",
    filename:(req,file,cb) => {
        cb(null,file.fieldname+"_"+Date.now()+path.extname(file.originalname));
    }
});

const upload = multer({
    storage: Storage
}).single('file');

const personSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    birthday: Date,
    gender: String,
    phone: String
});

const Person = mongoose.model('person',personSchema);


app.get('/',function(req,res) {
    res.render('home');
})

app.get('/login',function(req,res) {
    res.render('login');
})

app.post('/login',function(req,res) {
    var mail = req.body.log_mail;
    var pass = req.body.log_pass;
    console.log(pass);

    Person.findOne({email: mail}, function(err,ele) {
        if(err) {
            console.log(err);
        } else {

            bcrypt.compare(pass,ele.password,function(err,result) {
                if(result===true) {
                    res.send(ele);
                } else {
                    res.send("try aggain");
                }
            })

        }
    })
    
})


app.get('/register',function(req,res) {
    res.render('register');
})

app.post('/register',function(req,res) {
    var fname = req.body.fname;
    var lname = req.body.lname;
    var email = req.body.mailid;
    var pass = req.body.pass;
    var birth = req.body.birth;
    var gender = req.body.gender;
    var phone = req.body.phone;
    
    if(fname&&lname&&email&&pass&&birth&&gender&&phone) {
        bcrypt.hash(pass,saltRounds,function(err,hash) {
            const newP = new Person({
                name: fname+' '+lname,
                email: email,
                password: hash,
                birthday: birth,
                gender: gender,
                phone: phone
            });

            newP.save();
        })
    } else {
        res.send("try again ");
    }
})


app.get('/user',function(req,res) {
    res.render("user_page");
});


app.get('/profile',function(req,res) {
    res.render('profile');
});

app.post('/profile',upload,function(req,res) {
    console.log("yo yo bantha rapper");
});


app.listen(3000,function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log("u are connected");
    }
})