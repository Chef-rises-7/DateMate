const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyP = require('body-parser');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
var http = require('http').createServer(app);
var io = require('socket.io')(http);
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


const match_list = {
    name: String,
    birthday: String,
    link: String,
    image: String,
    venue: String,
    ven_link: String
};

const test_list = {
    name: "",
    birthday: "",
    link: "",
    image: "",
    venue: "",
    ven_link: ""
};

const hotels = ["Domino's","Pizza Hut","KFC","Cafe Coffee Day"];
const hot_links = ["https://www.dominos.co.in/","https://www.pizzahut.co.in/","https://online.kfc.co.in/home","https://www.cafecoffeeday.com/"];

const personSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    birthday: String,
    gender: String,
    phone: String,
    image: String,
    address: String,
    hobbies: String,
    flag: Number,
    match:Number,
    friend: Number,
    arr: [match_list],
    farr: [match_list]

});

const Person = mongoose.model('person',personSchema);

function remove_dup(data) {
    let unq = [];
    let ans = [];
    data.forEach(function(ele) {
        if(!unq.includes(ele.name)) {
            unq.push(ele.name);
            ans.push(ele);
        }
    });
    return ans;
};


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
            if(ele) {
            bcrypt.compare(pass,ele.password,function(err,result) {
                if(result===true) {
                    res.render("user_page",{ele: ele});
                } else {
                    res.send("try aggain password Incorrect");
                }
            })

        } else console.log("Please register before logging in.");

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
                    image: "/static/uploads/pink.jpg",
                    address: "",
                    hobbies: "",
                    flag: 0,
                    match: 0,
                    friend: 0,
                    arr: [test_list],
                    farr: [test_list]
                });
    
                newP.save();
            })

            const copy_ele =  {
                name: fname+' '+lname,
                email: email,
                birthday: birth,
                gender: gender,
                phone: phone,
                image: "/static/uploads/pink.jpg",
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
        image: "/static/uploads/" + req.file.filename,
        address: address,
        hobbies: hobbies
    };

    Person.findOneAndUpdate({email:mail},update_dict,function(err,ele) {
        if(err) {
            console.log(err);
        } else {
            ele.flag = 1;
            ele.save();
            console.log(ele);
            res.render('user_page',{ele: ele});
        }
    })

});

app.get('/view_prof/:email',function(req,res) {
    Person.findOne({email: req.params.email},function(err,ele) {
        if(err) {
            console.log(err);
        } else {
            console.log(ele);
            res.render('view_prof',{ele: ele});
        }
    })
})


app.get('/match/:email',function(req,res) {
    Person.findOne({email: req.params.email},function(err,ele) {
        if(err) {
            console.log(err);
        } else {
            res.render('match',{ele: ele});
        }
    })
})

app.post('/match/:email',function(req,res) {

    Person.findOne({email: req.params.email}, function(err,ele) {
        if(ele.gender === "M" && ele.flag===1) {
        Person.find({gender: "F",flag: 1}, function(erro,eles) {
            var len = eles.length;
            var rand = Math.floor((Math.random())*(len));
            var rand_hot = Math.floor(Math.random()*4);
            var hot = hotels[rand_hot];
            var hot_link = hot_links[rand_hot];
            const sender = {
                name: ele.name,
                birthday: ele.birthday,
                link: "/view_prof/"+ele.email,
                image: ele.image,
                venue: hot,
                ven_link: hot_link
            };

            const receiver = {
                name: eles[rand].name,
                birthday: eles[rand].birthday,
                link: "/view_prof/"+eles[rand].email,
                image: eles[rand].image,
                venue: hot,
                ven_link: hot_link
            };

            ele.match = 1;
            eles[rand].match = 1;


            eles[rand].arr.push(sender);
            eles[rand].arr = remove_dup(eles[rand].arr);


            ele.arr.push(receiver);
            ele.arr = remove_dup(ele.arr);
            
            ele.save();
            eles[rand].save();
        
        })

    } else if(ele.gender === "F" && ele.flag===1) {
        Person.find({gender: "M",flag: 1}, function(erro,eles) {
            var len = eles.length;
            var rand = Math.floor((Math.random())*(len));
            var rand_hot = Math.floor(Math.random()*4);
            var hot = hotels[rand_hot];
            var hot_link = hot_links[rand_hot];
            const sender = {
                name: ele.name,
                birthday: ele.birthday,
                link: "/view_prof/"+ele.email,
                image: ele.image,
                venue: hot,
                ven_link: hot_link
            };

            const receiver = {
                name: eles[rand].name,
                birthday: eles[rand].birthday,
                link: "/view_prof/"+eles[rand].email,
                image: eles[rand].image,
                venue: hot,
                ven_link: hot_link
            };

            ele.match = 1;
            eles[rand].match = 1;

            eles[rand].arr.push(sender);
            eles[rand].arr = remove_dup(eles[rand].arr);


            ele.arr.push(receiver);
            ele.arr = remove_dup(ele.arr);
            
            ele.save();
            eles[rand].save();
        
        })

    }

        res.render('match',{ele: ele});
    })

});




app.get('/chat',function(req,res) {
    res.render('chat');
});

var users = {};

io.on('connection', (socket) => {
    socket.on('new user', data => {
        users[socket.id] = data;
    })
    socket.on('send chat message', mssg => {
        io.emit('chat-message',{message: mssg, name: users[socket.id]});
    });
  });


  app.get('/preferences/:email',function(req,res) {
    Person.findOne({email: req.params.email},function(err,ele) {
        if(err) {
            console.log(err);
        } else {
            res.render('prefernces',{ele: ele});
        }
    })
  });;


  app.get('/friend/:email',function(req,res) {
    Person.findOne({email: req.params.email},function(err,ele) {
        if(err) {
            console.log(err);
        } else {
            res.render('friend',{ele: ele});
        }
    })
})

app.post('/friend/:email',function(req,res) {

    Person.findOne({email: req.params.email}, function(err,ele) {
        if(ele.gender === "M") {
        Person.find({gender: "F",flag: 1}, function(erro,eles) {
            var len = eles.length;
            var rand = Math.floor((Math.random())*(len));
            const sender = {
                name: ele.name,
                birthday: ele.birthday,
                link: "/view_prof/"+ele.email,
                image: ele.image
            };

            const receiver = {
                name: eles[rand].name,
                birthday: eles[rand].birthday,
                link: "/view_prof/"+eles[rand].email,
                image: eles[rand].image
            };

            ele.friend = 1;
            eles[rand].friend = 1;


            eles[rand].farr.push(sender);
            eles[rand].farr = remove_dup(eles[rand].farr);


            ele.farr.push(receiver);
            ele.farr = remove_dup(ele.farr);
            
            ele.save();
            eles[rand].save();
        
        })

    } else if(ele.gender === "F") {
        Person.find({gender: "M",flag: 1}, function(erro,eles) {
            var len = eles.length;
            var rand = Math.floor((Math.random())*(len));
            const sender = {
                name: ele.name,
                birthday: ele.birthday,
                link: "/view_prof/"+ele.email,
                image: ele.image
            };

            const receiver = {
                name: eles[rand].name,
                birthday: eles[rand].birthday,
                link: "/view_prof/"+eles[rand].email,
                image: eles[rand].image
            };

            ele.friend = 1;
            eles[rand].friend = 1;


            eles[rand].farr.push(sender);
            eles[rand].farr = remove_dup(eles[rand].farr);


            ele.farr.push(receiver);
            ele.farr = remove_dup(ele.farr);
            
            ele.save();
            eles[rand].save();
        
        })

    }

        res.render('friend',{ele: ele});
    })

});

http.listen(3000,function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log("u are connected");
    }
})