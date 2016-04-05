var bcrypt   = require('bcrypt-nodejs');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var config = require('../../config/mailer.js');

function generateHash (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

exports.generateHash = generateHash;

function validPassword (input_password, password) {
    return bcrypt.compareSync(input_password, password);
};

exports.validPassword = validPassword;

function sendEmailConfirmation (user){
	
    var smtpTransport = nodemailer.createTransport('SMTP', {
        service: 'gmail',
        auth: {
          user: config.user,
          pass: config.pass
        }
      });
    console.log(user.local.email);
      var mailOptions = {
        to: user.local.email,
        from: config.from,
        subject: 'informaTorrent! - Confirma tu cuenta',
        text: 'Querido usuario,' + user.local.email + '\n\n Bienvenido a nuestra aplicación de denuncias.\n Confirma tu cuenta de usuario accediendo a este link:\n http://localhost:3000/app/confirmar/' + user._id + '' 
      };
      smtpTransport.sendMail(mailOptions, function(err) {
    	  console.log(err + "error");
    	  if (err) return false;
    	  return true;
      });
};

exports.sendEmailConfirmation = sendEmailConfirmation;


function gravatar (email) {
	  var md5 = crypto.createHash('md5').update(email).digest('hex');
	  return 'https://gravatar.com/avatar/' + md5 + '?s=' + 300 + '&d=retro';
};

exports.gravatar = gravatar;


