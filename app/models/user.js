// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var crypto = require('crypto');
var nodemailer = require('nodemailer');

// define the schema for our user model
var userSchema = mongoose.Schema({

    local            : {
        email        : { type: String, unique: true, lowercase: true },
        password     : String,
        resetPasswordToken: String,
        resetPasswordExpires: Date,
        valid		 : Boolean,
        confirmToken : String
    },
    facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String,
        photo	     : String
    },
    twitter          : {
        id           : String,
        token        : String,
        displayName  : String,
        username     : String,
        photo	     : String
    },
    profile: {
	    nombre: String,
	    apellidos: String,
	    sexo: String,
	    username: String,
	    picture: String,
	    locationPref: {type: Object, default: {lat:'39.4320954' , lon: '-0.4710066'} }
    },
    createdAt : {type: Date, default: Date.now}

});

// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};


/**
 * Password hash middleware.
 */
userSchema.pre('save', function(next) {
  var user = this;
  if (!user.isModified('password')) return next();
  bcrypt.genSalt(10, function(err, salt) {
    if (err) return next(err);
    bcrypt.hash(user.password, salt, null, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

/**
 * 
 */

userSchema.methods.sendEmailConfirmation = function(user){
	
    var smtpTransport = nodemailer.createTransport('SMTP', {
        service: 'gmail',
        auth: {
          user: 'joherro123',
          pass: '321:Hermo'
        }
      });
    console.log(user.local.email);
      var mailOptions = {
        to: user.local.email,
        from: 'joherro123@gmail.com',
        subject: 'informaTorrent! - Confirma tu cuenta',
        text: 'Querido usuario,' + user.local.email + '\n\n Bienvenido a nuestra aplicación de denuncias.\n Confirma tu cuenta de usuario accediendo a este link:\n http://localhost:3000/app/confirmar/' + user._id + '' 
      };
      smtpTransport.sendMail(mailOptions, function(err) {
    	  console.log(err + "error");
      });

}

/**
 * Helper method for validating user's password.
 */
userSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.local.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

/**
 * Helper method for getting user's gravatar.
 */

userSchema.methods.gravatar = function(size, email) {
  if (!size) size = 200;
  var md5 = crypto.createHash('md5').update(email).digest('hex');
  return 'https://gravatar.com/avatar/' + md5 + '?s=' + size + '&d=retro';
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
