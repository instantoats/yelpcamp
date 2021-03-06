var express 	= require("express");
var router  	= express.Router();
var passport 	= require("passport");
var User  	 	= require("../models/user");
var Campground 	= require('../models/campground');
var Notification = require("../models/notification");
var { isLoggedIn } = require('../middleware');


// AUTH ROUTES
// ===========

// Root route
router.get("/", function(req, res){
	res.render("landing");
});

// Show register form
router.get("/register", function(req, res){
   res.render("register", {page: 'register'}); 
});

// Show Prepare page
router.get("/prepare", function(req, res){
	res.render("prepare"); 
 });



// Handle sign up logic
router.post("/register", function(req, res){
	var newUser = new User(
		{
			username: req.body.username, 
			firstName: req.body.firstName,
			lastName: req.body.lastName,
			email: req.body.email,
			avatar: req.body.avatar
		});
				
	User.register(newUser, req.body.password, function(err, user){
		if(err){
			console.log(err);
			return res.render("register", {error: err.message});
		}
		passport.authenticate("local")(req, res, function(){
		   req.flash("success", "Welcome to YelpCamp, " + user.username);
           res.redirect("/campgrounds"); 
		});
	});
});

// Show login form
router.get("/login", function(req, res){
   res.render("login"); 
});

// Handling login logic
router.post("/login", passport.authenticate("local", 
			{
				successRedirect: "/campgrounds", 
				failureRedirect: "/login"
			}), function(req, res){
		});

// logout route
router.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "See ya next time!");
   res.redirect("/campgrounds");
});

// user profile
router.get("/users/:id", async function(req, res) {
	try {
	  let user = await User.findById(req.params.id).populate('followers').exec();
	  res.render("../views/users/show.ejs", { user });
	} catch(err) {
	  req.flash("error", err.message);
	  return res.redirect("back");
	}
});
  
  // follow user
router.get("/follow/:id", isLoggedIn, async function(req, res) {
try {
		let user = await User.findById(req.params.id);
		user.followers.push(req.user._id);
		user.save();
		req.flash("success", 'You are now following ' + user.username + '!');
		res.redirect("/users/" + req.params.id);
	} catch(err) {
		req.flash("error", err.message);
		res.redirect("back");
}
});
  
// view all notifications
router.get('/notifications', isLoggedIn, async function(req, res) {
try {
		let user = await User.findById(req.user._id).populate({
		path: 'notifications',
		options: { sort: { "_id": -1 } }
		}).exec();
		let allNotifications = user.notifications;
		res.render('notifications/index', { allNotifications });
	} catch(err) {
		req.flash('error', err.message);
		res.redirect('back');
	}
});
  
// handle notification
router.get('/notifications/:id', isLoggedIn, async function(req, res) {
try {
	let notification = await Notification.findById(req.params.id);
	notification.isRead = true;
	notification.save();
	res.redirect(`/campgrounds/${notification.campgroundId}`);
} catch(err) {
	req.flash('error', err.message);
	res.redirect('back');
}
});
    
module.exports = router;
