const config = require("../config/auth.config");
const db = require("../models");
const { user: User, role: Role, refreshToken: RefreshToken } = db;



var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

/* The `exports.signup` function is responsible for handling the signup process for a user. It receives
the request (`req`) and response (`res`) objects as parameters. */
exports.signup = (req, res) => {
  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8),
  });

  user.save((err, user) => {
    if (err) {
      res.status(500).send({ message: err });
      return;
    }

    if (req.body.roles) {
      Role.find(
        {
          name: { $in: req.body.roles },
        },
        (err, roles) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          user.roles = roles.map((role) => role._id);
          user.save((err) => {
            if (err) {
              res.status(500).send({ message: err });
              return;
            }

            res.send({ message: "User was registered successfully!" });
          });
        }
      );
    } else {
      Role.findOne({ name: "user" }, (err, role) => {
        if (err) {
          res.status(500).send({ message: err });
          return;
        }

        user.roles = [role._id];
        user.save((err) => {
          if (err) {
            res.status(500).send({ message: err });
            return;
          }

          res.send({ message: "User was registered successfully!" });
        });
      });
    }
  });
};

/* The `exports.signin` function is responsible for handling the signin process for a user. It receives
the request (`req`) and response (`res`) objects as parameters. */
exports.signin = (req, res) => {
  console.log('LOGGING');
  User.findOne({
    username: req.body.username,
  })
    .populate("roles", "-__v")
    .exec(async (err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(401).send({ message: "Invalid Password!" });
      }

      var token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: config.jwtExpiration, // 24 hours
      });
      
      let refreshToken = await RefreshToken.createToken(user);

      var authorities = [];

      for (let i = 0; i < user.roles.length; i++) {
        authorities.push("ROLE_" + user.roles[i].name.toUpperCase());
      }

      req.session.token = token;

      res.status(200).send({
        id: user._id,
        username: user.username,
        email: user.email,
        roles: authorities,
        depositedBalance: user.depositedBalance,
        forwarderAddr:user.forwarderAddr,
        accessToken: token,
        refreshToken: refreshToken,
      });
    });
};

/* The `exports.userTransfer` function is responsible for updating the deposited balance of a user. It
receives the request (`req`) and response (`res`) objects as parameters. */
exports.userTransfer=async (req, res)=>{

  let username = req.body.username;
  let totalEth=req.body.balance;
  console.log("transfer Balance update"+username+"balance: "+totalEth);
  User.findOneAndUpdate({ username: username }, { depositedBalance: totalEth }, { new: true }, function (error, user) {
    if (error) {
      console.log(error);
    }
    else {
        console.log("transfer updated");
        res.status(200).send();
         
    } // done isnt real 
  })
}
/* The `exports.userData` function is responsible for retrieving the user data from the database and
sending it as a response. */
exports.userData = (req, res) => {
  console.log('refreshing');
  User.findOne({
    username: req.body.username,
  })
    .populate("roles", "-__v")
    .exec(async (err, user) => {
      if (err) {
        res.status(500).send({ message: err });
        return;
      }

      if (!user) {
        return res.status(404).send({ message: "User Not found." });
      }

      res.status(200).send({
        _id:user.id,
        username: user.username,
        depositedBalance: user.depositedBalance,
        forwarderAddr:user.forwarderAddr,
      });
    });
};



/* The `exports.signout` function is responsible for updating the `forwarderAddr` field of a user in
the database. It receives the request (`req`) and response (`res`) objects as parameters. */

exports.signout = async (req, res) => {
  console.log('updating');
  console.log(req.body.forwarderAddr);
  //console.log('from kafka'+parseInt(Amount));
  const id = req.params.id;

  User.findByIdAndUpdate(id,{forwarderAddr:req.body.forwarderAddr},function(err,docs){
    if(err){
      console.log(err)
      res.status(500).send(err);
    }
    else{
      res.status(200).send(docs);
    }
  })
};

/* The `exports.updateUsr` function is responsible for updating the user session and sending a response
indicating that the user has been signed out. */

exports.updateUsr = async(req, res) => {
  try {
    req.session = null;
    return res.status(200).send({ message: "You've been signed out!" });
  } catch (err) {
    this.next(err);
  }
};




/* The `exports.refreshToken` function is responsible for refreshing the access token of a user. It
receives the request (`req`) and response (`res`) objects as parameters. */

exports.refreshToken = async (req, res) => {
  const { refreshToken: requestToken } = req.body;

  if (requestToken == null) {
    return res.status(403).json({ message: "Refresh Token is required!" });
  }

  try {
    let refreshToken = await RefreshToken.findOne({ token: requestToken });

    if (!refreshToken) {
      res.status(403).json({ message: "Refresh token is not in database!" });
      return;
    }

    if (RefreshToken.verifyExpiration(refreshToken)) {
      RefreshToken.findByIdAndRemove(refreshToken._id, { useFindAndModify: false }).exec();
      
      res.status(403).json({
        message: "Refresh token was expired. Please make a new signin request",
      });
      return;
    }

    let newAccessToken = jwt.sign({ id: refreshToken.user._id }, config.secret, {
      expiresIn: config.jwtExpiration,
    });

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: refreshToken.token,
    });
  } catch (err) {
    return res.status(500).send({ message: err });
  }
}
