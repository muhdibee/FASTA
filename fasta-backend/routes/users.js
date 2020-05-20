/* eslint-disable consistent-return */
/* eslint-disable func-names */
/* eslint-disable no-undefined */
const express = require("express");
const crypto = require("crypto");
const async = require("async");


const router = express.Router();
const User = require("../models/index.js");
const bcrypt = require("../helpers/auth");
const authChecker = require("../middlewares/authChecker");
const mailer = require("../helpers/mailer");


//  CREATE A NEW USER AND ADD TO DATABASE
router.post("/", async (req, res) => {
  // console.log(req.body);
  // eslint-disable-next-line consistent-return
  await User.findOne({ email: req.body.email }).then((result) => {
    if (result) {
      return res.status(403).json({ response: "email exists" });
    }
  });
  try {
    const {
      fullname, email, phonenumber, password, confirmPassword
    } = req.body;
    if (password !== confirmPassword) {
      return res.status(403).json({ response: "confirmpassword and password doesn't match" });
    }
    const hash = await bcrypt.hashPassword(confirmPassword);
    await User.create({
      fullname, email, phonenumber, password: hash
    });
    const welcomelink = `${req.origin}/login`;
    const options = {
      receiver: email,
      subject: "Fasta welcomes you!",
      text: `Hello ${fullname}`,
      output: `<div style='margin: 0 auto; background: #ededed; border-top:2px solid green; border-bottom:2px solid green; box-shadow: 1px 2px 3px 4px #ccc; padding: 1.5rem '>
      <h1>Hey! ${fullname} Welcome to Fasta</h1>
      <hr>
      <p style='padding:1.5rem;'>FASTA helps you plan your trip and allow you to go faster, click this <a href="${welcomelink}">Link</a> to login to a new world of convenience and safety</p>
      <h4>Welcome on board</h4>
      </div>
      `
    };
    mailer(options);
    return res.status(200).json({ response: "Signup succesfully" });
  } catch (error) {
    return res.status(500).json({ response: error.message });
  }
});

// USER LOGIN HERE
router.post("/login", async (req, res) => {
  const {
    email, password
  } = req.body;

  await User.findOne({ email })
    .exec()
    .then((user) => {
      if (!user || user.length < 1) {
        return res.status(401).json({ response: "Auth failed" });
      }
      const passwordcheck = bcrypt.comparePassword(password, user.password);
      if (passwordcheck) {
        const token = bcrypt.generateToken(user);
        return res.status(200).json({
          response: "Login succesfull",
          token
        });
      }
      return res.status(401).json({ response: "Auth failed" });
    }).catch((error) => res.status(500).json({ response: error.message }));
});

//  GET ALL USERS FROM DATABASE
router.get("/", authChecker, (req, res) => {
  User.find().then(
    (allUsers) => {
      res.status(200).json(allUsers.reverse());
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error
      });
    }
  );
});

//  GET A SPECIFIC USER BY ID) FROM DATABASE
router.get("/:id", authChecker, (req, res) => {
  const { id } = req.params;

  User.findOne({
    _id: id
  }).then(
    (thisUser) => {
      //   console.log("Getting specific user by ID!");
      res.status(200).json(thisUser);
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error
      });
    }
  );
});

router.post("/forget", (req, res, next) => {
  const { email, origin } = req.body;
  // houses muliple functions
  async.waterfall([
    function (done) {
      crypto.randomBytes(20, (err, buf) => {
        // eslint-disable-next-line prefer-const
        let token = buf.toString("hex");
        done(err, token);
      });
    },

    function (token, done) {
      User.findOne({ email }, (err, user) => {
        if (!user) {
          // console.log("email not found");
          return res.status(404).json({ response: `${email}, not found, please check the email again` });
        }
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save()
          .then(() => {
            // console.log(result.resetPasswordToken, result.resetPasswordExpires);
            done(err, token, user);
          });
        // return res.status(200).json({ response: user });
      });
    },

    function (token, user, done) {
      try {
        const resetlink = `${origin}/changepassword?${token}`;
        const options = {
          receiver: email,
          subject: "Password Reset",
          text: `Hello ${user.fullname}`,
          output: `<div style='margin: 0 auto; background: #ededed; border-top:2px solid green; border-bottom:2px solid green; box-shadow: 1px 2px 3px 4px #ccc; padding: 1.5rem '>
          <div style='width:98%;margin-left:1%;border-bottom:1px dotted black;text-align:center;padding:15px 0;'><img src='<%= site.siteLogo %>' style='height:75px'/></div>
          <div style='margin:0 1% 1%;background:#f1f1f1;padding:20px;'>
            A password request was received, click the link below to proceed with resetting your password, <b>the link expires in 1hr</b>:</p>
            
           <p style='color: black;margin: 0px 0 30px;font-size:16px;text-align:center'><a href= "${resetlink}" style="background:blue;padding:10px 12px;color:white">RESET PASSWORD</p>
           <p style='color: red;text-align:center;margin: 15px 0;font-size:16px'>Kindly disregard this email if you didn't request for password reset.</p>
           <p> if the above button didnt work, you can copy and paste this link below into your browser </p>
            ${resetlink}
           <p style='color: black;margin: 0px 0 15px;font-size:16px;'>Thank you.</p>
           `

        };
        const fireTheMail = mailer(options);
        if (fireTheMail) {
          return res.json({ response: `Email sent to ${email}`, resetlink, token: user.resetPasswordToken });
        }
        done(null, "done");
      } catch (error) {
        res.status(500).json({ response: `Error ${error} occured` });
        done(error, false);
      }
    }
  ], (err) => {
    if (err) {
      return next(err);
    }
    return res.status(500).json({ response: `An error ${err} occurred doing the process` });
  });
});


router.route("/reset/:token")
  .all()
  .get(async (req, res) => {
    console.log(req.params);
    await User.findOne({
      resetPasswordToken: req.params.token, resetPasswordExpires: { $gte: Date.now() }
    }).then((user) => {
      if (!user) {
        return res.status(401).json({ response: "Invalid user" });
      }
      return res.status(200).json({ response: { token: req.params.token } });
    });
  })
  .post(async (req, res) => {
    const { password, confirmPassword } = req.body;
    console.log(req.params);
    if (!password || !confirmPassword) {
      return res.status(403).json({ response: "Both fields are required" });
    }
    if (password !== confirmPassword) {
      return res.status(403).json({ response: "password and confirmpassword didn\t match" });
    }
    try {
      const hash = await bcrypt.hashPassword(password);
      const user = await User.findOneAndUpdate(
        { resetPasswordToken: req.params.token, resetPasswordExpires: { $gte: Date.now() } },
        // eslint-disable-next-line max-len
        { $set: { password: hash }, resetPasswordToken: null, resetPasswordExpires: null },
        { useFindAndModify: false }
      );
      if (!user) {
        return res.status(404).json({ response: "Invalid user" });
      }
      res.status(200).json({ response: "your password reset was succesful, login to continue" });
      const loginlink = `${req.origin}/users/login`;
      const options = {
        receiver: user.email,
        subject: "Password Reset",
        text: `Hello ${user.fullname}`,
        output: `<div style='margin: 0 auto; background: #ededed; border-top:2px solid green; border-bottom:2px solid green; box-shadow: 1px 2px 3px 4px #ccc; padding: 1.5rem '>
        <div style='width:98%;margin-left:1%;border-bottom:1px dotted black;text-align:center;padding:15px 0;'><img src='<%= site.siteLogo %>' style='height:75px'/></div>
        <div style='margin:0 1% 1%;background:#f1f1f1;padding:20px;'>
            <h3 style='color: black;margin: 0px 0 15px;'>Hello ${user.fullname},</h3>
            <p style='color: black;margin: 0px 0 30px;font-size:16px'>Your password reset request was successful, kindly login with the newly set password.</p>
            <p style='color: black;margin: 0px 0 30px;font-size:16px;text-align:center'><a href="${loginlink}" style="background:blue;padding:10px 12px;color:white">LOGIN TO DASHBOARD</p>
            <p style='color: black;margin: 0px 0 15px;font-size:16px;'>Thank you.</p>
        </div>
    </div>` 
      };
      mailer(options);

      return res.status(200).json({ response: "mail sent", loginlink });
    } catch (error) {
      return res.status(500).json({ response: `error ${error} occurred` });
    }
  });


module.exports = router;
