const { verifySignUp } = require("../middlewares");
const controller = require("../controllers/auth.controller");
const controllerUser=require("../controllers/user.controller");

module.exports =  function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, Accept"
    );
    next();
  });

  app.post(
    "/api/auth/signup",
    [
      verifySignUp.checkDuplicateUsernameOrEmail,
      verifySignUp.checkRolesExisted
    ],
    controller.signup
  );

  app.post("/api/auth/signin", controller.signin);
  app.post("/api/auth/update/", controller.updateUsr);//SIGNOUT
  app.put("/api/auth/signout/:id", controller.signout);//UPDATE possiblity to update 
  app.post("/api/auth/refreshtoken", controller.refreshToken);

};
