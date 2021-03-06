const express = require("express");
const router = express.Router();
const User = require("../Model/User");
const bcrypt = require("bcryptjs");
const {
  registerValidation,
  loginValidation,
  tokenValidation,
} = require("../validation");
const jwt = require("jsonwebtoken");

//Create user
router.post("/", registerValidation, (req, res) => {
  User.findOne({ email: req.body.email }, (err, data) => {
    if (!err) {
      return res.status(400).send("User already exits");
    }
    const user = new User({
      username: req.body.username,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      age: req.body.age,
      country: req.body.country,
      password: bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10)),
      joined: new Date(),
      role: req.body.role,
    });
    user
      .save()
      .then((data) => {
        res.json(data._id);
      })
      .catch((err) => {
        res.json({ message: err });
      });
  });
});

//Delete a user
router.delete("/:id", (req, res) => {
  User.deleteOne({ _id: req.params.id }, (err, delres) => {
    console.log(err);
    if (err) {
      return res.status(400).json({ res: false, message: err.message });
    }
    res.statusCode = 200;
    res.json({ message: "User deleted.." });
  });
});

//Return all the user.. This will be used by admin only
router.get("/", tokenValidation, (req, res) => {
  User.findOne({ _id: req.user }, (err, user) => {
    if (err) res.send(err);
    else if (user.role != "admin") res.send("Denied");
    else {
      User.find((err, users) => {
        if (err) res.json({ message: err });
        else {
          res.json(users);
        }
      });
    }
  });
});

//Get a particular user
router.get("/:id", (req, res) => {
  User.findOne({ _id: req.params.id }, (err, user) => {
    if (err) {
      res.status(400).json({
        res: false,
        message: err.message,
      });
    } else if (user.length !== 0) {
      res.json(user._id);
    } else {
      res.send("Not such user found");
    }
  });
});

//Update user fields
router.patch("/:id", (req, res) => {
  User.findOne({ _id: req.params.id }, (err, user) => {
    if (err) {
      return res.send(err.message);
    } else {
      User.updateOne(
        { _id: req.params.id },
        {
          $set: {
            country:
              req.body.country !== undefined ? req.body.country : user.country,
            email: req.body.email !== undefined ? req.body.email : user.email,
            password:
              req.body.password !== undefined
                ? bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10))
                : user.password,
            age: req.body.age != undefined ? req.body.age : user.age,
            role: req.body.role != undefined ? req.body.role : user.role,
          },
        },
        (err, resl) => {
          if (err) res.send(err);
          else {
            res.json(resl);
          }
        }
      );
    }
  });
});

//Login route
router.post("/login", loginValidation, (req, res) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (err) {
      return res.status(400).send("Please register");
    } else if (user !== null) {
      bcrypt.compare(req.body.password, user.password, (err, resl) => {
        if (err) console.log(err);
        else if (resl) {
          jwt.sign(
            { _id: user._id },
            process.env.SECRET,
            //{ expiresIn: "30000ms" }, add it later not during development
            (err, token) => {
              if (err) console.log(err);
              else {
                res.json({
                  token: token,
                  message: "Login Successful",
                });
              }
            }
          );
        } else if (!resl) {
          res.status(404).send("login failed");
        }
      });
    }
  });
});

module.exports = router;
