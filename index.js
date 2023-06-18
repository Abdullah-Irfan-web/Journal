const express=require("express");
const app=express();
const path=require("path");
const bodyparser=require("body-parser");
const mongoose=require('mongoose');
const PORT=process.env.PORT||3000;
const dotenv=require("dotenv");
const shortid=require("shortid");
const passport=require('passport');
const LocalStrategy=require('passport-local').Strategy
const bcrypt=require('bcryptjs');
const multer=require('multer');



const session=require('express-session');
const user=require('./Models/User');
const Journal=require('./Models/Journal');
const Notification=require('./Models/Notification')

app.set('view engine','ejs');

app.set('views',path.join(__dirname,'views'));
app.use(express.static('public'));
app.use(bodyparser.urlencoded({extended:true}));
app.use(express.json());

dotenv.config({path:'./config.env'})

//  Database Connection
const DB=process.env.DATABASE

mongoose.connect(DB,{
    useNewUrlParser:true,

   
});

const db=mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {

    console.log("Connected");
});

//Passport Setup

passport.use(new LocalStrategy({usernameField:'email'},(email,password,done)=>{
    user.findOne({email:email})
    .then(userr=>{
        if(!userr){
            return done(null,false)
        }
        bcrypt.compare(password,userr.password,(err,isMatch)=>{
            if(isMatch){
                return done(null,userr)
            }
            else{
                return done(null,false)
            }
        })
    })
    .catch(err=>{
        console.log(err);
    })
}))


app.use(session({
    secret:"Node",
    resave:true,
    saveUninitialized:true
}))


passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.name ,role:user.role});
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });
app.use(passport.initialize());
app.use(passport.session());


var Storage=multer.diskStorage({
    destination:(req,file,callback)=>{
        callback(null,'./public')
    },
    filename:(req,file,callback)=>{
        callback(null,file.fieldname+"_"+Date.now()+"_"+file.originalname);
    }
});

var upload=multer({
    storage:Storage
}).single('file');

function ensureauthentication(req,res,next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/login');
}

function ensureteacherauthentication(req,res,next){
    if(req.isAuthenticated() && req.user.role==='Teacher'){
        return next();
    }
    res.redirect('/login');
}
//Register
app.get('/',(req,res)=>{
   
   
res.render('register');
})
app.get('/json',(req,res)=>{
   
   let data={
    "value":"Register"
   }
    res.send(data);
    })
//login
app.get('/login',(req,res)=>{
    res.render('login');
})
app.get('/login/json',(req,res)=>{
   
   
    res.render("Login");
    })

//teacher
app.get('/teacher',ensureteacherauthentication,(req,res)=>{
    Journal.find({username:req.user.username})
    .then(result=>{
        res.render('teacher',{result:result});
    })
   
})
app.get('/teacher/json',ensureteacherauthentication,(req,res)=>{
    Journal.find({username:req.user.username})
    .then(result=>{
        res.send(result);
    })
   
})

app.get('/addjournal',ensureteacherauthentication,(req,res)=>{
    user.find({role:"Student"})
    .then(result=>{
        res.render('addjournal',{data:result});
    })
    
})
app.get('/notification',ensureauthentication,(req,res)=>{
    Notification.find({to:req.user.username})
    .then(data=>{
        res.render('notification',{data:data});
    })
})
app.get('/notification/json',ensureauthentication,(req,res)=>{
    Notification.find({to:req.user.username})
    .then(data=>{
        res.send(data);
    })
})
app.get('/notification/edit/:id',ensureauthentication,(req,res)=>{
    Notification.deleteOne({_id:req.params.id})
    .then(resu=>{
        res.redirect('/notification')
    })
})
app.get('/addjournal/json',ensureteacherauthentication,(req,res)=>{
    res.send("Add Journal");
    
})
app.get('/student',ensureauthentication,async(req,res)=>{
    let noti=await Notification.find({to:req.user.username});
      Journal.find({studenttag:req.user.username})
    .then(result=>{
       
        res.render('student',{result:result,noti:noti.length});
    })
    
})
app.get('/student/json',ensureauthentication,async(req,res)=>{
    Journal.find({studenttag:req.user.username})
  .then(result=>{
      res.send(result);
     
  })
  
})
app.get('/logout', function(req, res, next) {
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/login');
    });
  });
app.get('/teacher/del/:id',ensureteacherauthentication,(req,res)=>{

    Journal.deleteOne({_id:req.params.id})
    .then(result=>{
        res.redirect('/teacher');
    })
})


app.get('/teacher/edit/:id',ensureteacherauthentication,async(req,res)=>{
   let result=await user.find({role:"Student"});
    Journal.findOne({_id:req.params.id})
    .then(data=>{
        res.render('teacheredit',{data:data,result:result})
    })
})

//Post
app.post('/register',(req,res)=>{
    const{name,email,password,type}=req.body;
    user.findOne({$or:[{name:name},{email:email}]})
    .then(userr=>{
        if(userr){
           
            return res.send("User already Exist !!")
        }

       
        const newuser=new user({
            name:name,
            email:email,
            password:password,
            role:type

        })
        bcrypt.genSalt(10,(err,salt)=>
        bcrypt.hash(newuser.password,salt,(err,hash)=>{
            if(err)
            throw err;
            newuser.password=hash;
           
        newuser.save()
        .then(userr=>{
           
            res.redirect('/login')
        })
        .catch(err=>{
            console.log(err);
        })
        })
        
        )


    })

})
app.post('/register/json',(req,res)=>{
    const{name,email,password,type}=req.body;
    user.findOne({$or:[{name:name},{email:email}]})
    .then(userr=>{
        if(userr){
           
            return res.send("User already Exist !!")
        }

       
        const newuser=new user({
            name:name,
            email:email,
            password:password,
            role:type

        })
        bcrypt.genSalt(10,(err,salt)=>
        bcrypt.hash(newuser.password,salt,(err,hash)=>{
            if(err)
            throw err;
            newuser.password=hash;
           
        newuser.save()
        .then(userr=>{
           
            res.send(user);
        })
        .catch(err=>{
            console.log(err);
        })
        })
        
        )


    })

})

const geturl = (req) => {
    return req.user.role === 'Teacher' ? '/teacher' : '/student'
}
app.post('/login',
    passport.authenticate('local'),
    function(req, res) {
     
      res.redirect(geturl(req));
    });

    app.post('/login/json',
    passport.authenticate('local'),
    function(req, res) {
     
      res.send(req.user.id);
    });
    app.post('/addteacherjournal',ensureteacherauthentication,(req,res)=>{
       

        upload(req,res,async(err)=>{
            if(err){
                res.send('Unable to add journal try again and add file')
            }
            else{
                let objectDate = new Date();


        let day = objectDate.getDate();


        let month = objectDate.getMonth();


        let year = objectDate.getFullYear();
                let data={
                    username:req.user.username,
                    journalname:req.body.jname,

                    journaldescription:req.body.jdes,

                    studenttag:req.body.studenttag,
                    file:req.file.filename,
                    year:year,
                    month:month,
                    day:day

                }
                let noti={
                    to:req.body.studenttag,
                    from:req.user.username
                 }
                 let resultnoti=await Notification.create(noti);
                let result=await Journal.create(data)
                res.redirect('/teacher')
                
            }

        })
       
    })


   

    app.post('/teacher/edit/:id',ensureteacherauthentication,(req,res)=>{
        let searchquery={_id:req.params.id};
        upload(req,res,async(err)=>{
            if(err){
                res.send('Unable to edit journal try again and add file')
            }
            else{
                let objectDate = new Date();


        let day = objectDate.getDate();


        let month = objectDate.getMonth();


        let year = objectDate.getFullYear();
              
        let noti={
            to:req.body.studenttag,
            from:req.user.username
         }
         let resultnoti=await Notification.create(noti);
                let result=await Journal.updateOne(searchquery,{$set:{
                    username:req.user.username,
                    journalname:req.body.jname,

                    journaldescription:req.body.jdes,

                    studenttag:req.body.studenttag,
                    file:req.file.filename,
                    year:year,
                    month:month,
                    day:day
                }})
                res.redirect('/teacher')
                
            }

        })
    })







    
app.listen(PORT,()=>{
    console.log("Server started");
})