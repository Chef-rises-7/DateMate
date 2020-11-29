const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyP = require('body-parser');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const saltRounds = 10;

app.set('view engine','ejs');
app.use('/static', express.static(__dirname + "/public"))
app.use(bodyP.urlencoded({extended: true}));
mongoose.connect("mongodb://localhost:27017/PersonDB",{ useNewUrlParser: true,useUnifiedTopology: true, useFindAndModify: false });

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
    phone: String,
    image: String,
    address: String,
    hobbies: String
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

    Person.findOne({email: mail}, function(err,ele) {
        if(err) {
            console.log(err);
        } else {
            bcrypt.compare(pass,ele.password,function(err,result) {
                if(result===true) {
                    res.render("user_page",{ele: ele});
                } else {
                    res.send("try aggain password Incorrect");
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

    Person.findOne({email:email},function(err,ele) {
        if(ele) {
            res.send("User already exist Please try again.");
        } else {
            bcrypt.hash(pass,saltRounds,function(err,hash) {
                const newP = new Person({
                    name: fname+' '+lname,
                    email: email,
                    password: hash,
                    birthday: birth,
                    gender: gender,
                    phone: phone,
                    image: "",
                    address: "",
                    hobbies: ""
                });
    
                newP.save();
            })

            const copy_ele =  {
                name: fname+' '+lname,
                email: email,
                birthday: birth,
                gender: gender,
                phone: phone
            }

            res.render('user_page',{ele: copy_ele});
        }
    })
})



app.get('/update/:email',function(req,res) {
    res.render('update',{email: req.params.email});
});

app.post('/update/:email',upload,function(req,res) {
    const mail = req.params.email;
    const hobbies = req.body.hobbies;
    const address = req.body.address;

    const update_dict = {
        image: req.file.filename,
        address: address,
        hobbies: hobbies
    };

    Person.findOneAndUpdate({email:mail},update_dict,function(err,ele) {
        if(err) {
            console.log(err);
        } else {
            console.log(ele);
        }
    })
    console.log("yo yo bantha rapper");
});

app.get('/view_prof/:email',function(req,res) {
    res.render('view_prof');
})


app.listen(3000,function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log("u are connected");
    }
})