var express = require('express');
const passport = require('passport');
var router = express.Router();
const userModel = require("./users")
const postModel = require("./posts")
const multer = require("multer")
const fs = require("fs")
const path = require("path")
const crypto = require("crypto")
const mailer = require("../nodemailer")


const localStrategy = require("passport-local")
passport.use(new localStrategy(userModel.authenticate()))

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)+ path.extname(file.originalname)
    cb(null, file.fieldname + '-' + uniqueSuffix)
  }
})

const upload = multer({ storage: storage })

router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/forgot', function(req, res, next) {
  res.render('forgot');
});


router.post('/forgot',async function(req, res, next) {
  let user = await userModel.findOne({email : req.body.email})
    if(!user){
      res.send("we have send the mail if your email exist")
    }
    else{
      crypto.randomBytes(80,async function(err,buff){
        let key = buff.toString("hex")
        user.key = key;
        await user.save()
        mailer(req.body.email,user._id,key)
        .then(function(){
          res.send("mail send")
        })
      })
    }
 
});

router.post('/reset/:userid', async function (req, res, next) {
  let user = await userModel.findOne({_id: req.params.userid});
   user.setPassword(req.body.passport,async function(){
      // user.key = "";
      await  user.save()
      req.logIn(user ,function(){
        res.redirect("/profile")
      })
   })
});

router.get('/forgot/:userid/:key', async function (req, res, next) {
  let user = await userModel.findOne({_id: req.params.userid});
  if(user.key === req.params.key){
    // show a page to a user which asks for new passwords 
    res.render("reset", {user})
  }
  else{
    res.send("tez hmmmmmmmm.");
  }
});

router.get('/profile', isLoggedIn, function (req, res, next) {
  userModel
  .findOne({ username: req.session.passport.user })
  .populate("posts")
  .then(function (foundUser) {
    console.log(foundUser);
    res.render("profile", { foundUser })
  })
});

router.post('/upload', isLoggedIn, upload.single("image"), function (req, res, next) {
  // upload ho chuki hai data req.file mein hai
  userModel
    .findOne({ username: req.session.passport.user })
    .then(function (founduser) {
      console.log(founduser)
      if (founduser.image !== 'def.png') {
        fs.unlinkSync(`./public/images/uploads/${founduser.image}`);
      }
      founduser.image = req.file.filename;
      founduser.save()
      .then(function () {
        res.redirect("back");
      })
    });
});
router.get('/edit/:username',isLoggedIn , function (req, res, next) {

  userModel.findOne({username:req.session.passport.user})
  .then(function(foundUser){
    res.render("edit",{foundUser})
  })
});

router.get('/check/:username',isLoggedIn , function (req, res, next) {
      userModel.findOne({username : req.params.username})
      .then(function(user){
        if(user){
          res.json(true)
        }
        else{
          res.json(false)
        }
      })
});

router.post('/update',isLoggedIn , function (req, res, next) {
   userModel.findOneAndUpdate({username : req.session.passport.user},{username: req.body.username},{new: true})
   .then(function(updateduser){
    req.login(updateduser, function(err) {
      if (err) { return next(err); }
      return res.redirect("/profile");
    });
   })
});

router.get('/like/:postid', isLoggedIn, function (req, res, next) {
  userModel
  .findOne({username: req.session.passport.user})
  .then(function(user){
    postModel
    .findOne({_id: req.params.postid})
      .then(function(post){
        if(post.likes.indexOf(user._id) === -1){
          post.likes.push(user._id);
        }
        else{
          post.likes.splice(post.likes.indexOf(user._id), 1);
        }

        post.save()
        .then(function(){
          res.redirect("back");
        })
      })
  })
});

router.post('/post', isLoggedIn, function (req, res, next) {
  userModel
  .findOne({username: req.session.passport.user})
  .then(function(user){
    postModel.create({
      userid: user._id,
      data: req.body.post
    })
    .then(function(post){
      user.posts.push(post._id);
      user.save()
      .then(function(){
        res.redirect("back");
      })
    })
  })
});

router.get('/feed', isLoggedIn, function (req, res, next) {
  userModel.findOne({username: req.session.passport.user})
  .then(function(user){
    postModel
    .find()
    .populate("userid")
      .then(function (allposts) {
        res.render("feed", { allposts, user });
      });
  })
});
  

router.get('/login', function(req, res, next) {
  res.render('login');
});

router.post('/login', passport.authenticate('local',{
  successRedirect : "/profile",
  failureRedirect : "/login"
}),function(req,res,next){});


router.get("/logout",isLoggedIn,(req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
})



router.post('/register', function(req, res, next) {
    var newUser = new userModel({
      username : req.body.username,
      email : req.body.email,
      age : req.body.age,
      image : req.body.image
    });
    userModel.register(newUser , req.body.password)
    .then(function(u){
         passport.authenticate('local')(req,res, function(){
          res.redirect("/profile")
         })
    })
});



function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next();
  }
  else{
    res.redirect("/login")
  }
}

module.exports = router;


