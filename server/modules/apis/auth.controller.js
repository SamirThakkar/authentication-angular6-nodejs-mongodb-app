const Auth = require('../../models/auth.model');
const jwt = require('jsonwebtoken');
const crypto = require('crypto').randomBytes(256).toString('hex');

class AuthController {
    constructor(app){
      app.post('/register',this.register);
      app.post('/login', this.login);
    }

  register(req,res){
    if (!req.body.Email) {
      res.json({success: false, message: 'You must provide an e-mail'});
    } else if (!req.body.Password) {
      res.json({success: false, message: 'You must provide a password'});
    } else {
      let user = new Auth({
        Email: req.body.Email.toLowerCase(),
        Password: req.body.Password
      });

      Auth.findOne({Email: user.Email}, function (err, foundUser) {
        if (err) {
          throw err;
        } else if (foundUser) {
          res.send({success: false, message: " User already Exist."});
        } else {
          user.save((err) => {
            if (err) {
              if (err) {
                throw err;
              } else {
                res.json({success: false, message: 'Could not save user. Error: ', err});
              }
            } else {
              res.json({success: true, message: 'Account registered!'});
            }
          });

        }

      });

    }
  }

  login(req,res){
    if (!req.body.Email) {
      res.json({success: false, message: 'No email was provided'});
    } else {
      if (!req.body.Password) {
        res.json({success: false, message: 'No password was provided.'});
      } else {
        Auth.findOne({Email: req.body.Email.toLowerCase()}, (err, user) => {
          if (err) {
            res.json({success: false, message: err});
          } else {
            if (!user) {
              res.json({success: false, message: 'User not found.'});
            } else {
              const savedPassword = user.Password;
              if (req.body.Password !== savedPassword) {
                res.json({success: false, message: 'Password invalid'});
              } else {
                const token = jwt.sign({userId: user._id}, crypto, {expiresIn: '24h'});
                res.json({
                  success: true,
                  message: 'Login Successful!',
                  token: token,
                  user: user

                });
              }
            }
          }
        });
      }
    }

  }
}

module.exports = AuthController;


