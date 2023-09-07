const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");
var Web3 = require('web3')
const fetch = require('node-fetch');
const notifier = require('node-notifier');

const dbConfig = require("./app/config/db.config");
const config = require("./app/config/auth.config");


const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
io.on('connection', () => {
  console.log("a user has connected");
 });
server.listen(3000);

var corsOptions = {
  origin: ["http://localhost:8081"],
  credentials: true
}

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

app.use(
  cookieSession({
    name: "HasseneING-session",
    secret: "COOKIE_SECRET", // should use as secret environment variable
    httpOnly: true
  })
);

const db = require("./app/models");
const Role = db.role;
const User = db.user;

db.mongoose
  .connect(`mongodb+srv://HasseneING:${dbConfig.NOTPW}@cluster0.2uyma.mongodb.net/?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Successfully connect to MongoDB.");
    initial();
  })
  .catch(err => {
    console.error("Connection error", err);
    process.exit();
  });

// simple route
app.get("/", (req, res) => {
  res.json({ message: "Hello ." });
});

// routes
require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

async function initial() {

  User.find({}, function (err, users) {
    var userMap = {};
    users.forEach(async function (user) {
      userMap[user._id] = user;
      console.log(user.forwarderAddr);
      const body = {
        "type": "TO_ADDRESS",
        "transactionIdentifierValue": user.forwarderAddr.toLowerCase(),
        "nodeName": "default",
        "statuses": ["CONFIRMED", "FAILED"]
      }
      const response = await fetch('http://localhost:8060/api/rest/v1/transaction', {
        method: 'post',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
      })
      const data = await response.json();
     // console.log(data);
    });
  })
  Role.estimatedDocumentCount((err, count) => {
    if (!err && count === 0) {
      new Role({
        name: "user"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'user' to roles collection");
      });

      new Role({
        name: "admin"
      }).save(err => {
        if (err) {
          console.log("error", err);
        }

        console.log("added 'admin' to roles collection");
      });
    }
  });
}
global.commited = 0;
const { Kafka } = require('kafkajs');
const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092'],
})
const consumer = kafka.consumer({ groupId: 'test-group' })

var totalEth = 0;
const run = async () => {
  // Consuming
  await consumer.connect()
  await consumer.subscribe({ topic: 'transaction-events', fromBeginning: false })

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      /*console.log({
        value: JSON.parse(message.value).details.value, // Get eth of user from forwarder address update accordingly goodnight 
        forwarderAddress: JSON.parse(message.value).details.to
      })*/
      if (JSON.parse(message.value).details.status === 'CONFIRMED') {
        let ethAmount = Web3.utils.fromWei(JSON.parse(message.value).details.value, 'ether');
        let forwarderAddress = JSON.parse(message.value).details.to;
       // console.log(ethAmount);
        let usradd = User.findOne({ forwarderAddr: forwarderAddress }).then((docs) => {
          totalEth = parseFloat(docs.depositedBalance) + parseFloat(ethAmount);
        //  console.log("Result :", totalEth); //underfined
          let totalEthStr = String(totalEth);
          //console.log(totalEthStr);
          User.findOneAndUpdate({ forwarderAddr: forwarderAddress }, { depositedBalance: totalEthStr }, { new: true }, function (error, user) {
            if (error) {
              console.log(error);
            }
            else {
            //  console.log("send socket Deposited Value from here " + user.depositedBalance);
              notifier.notify({
                title: 'Thank you for Trusting us!',
                message: 'We recieved your Transfer of '+parseFloat(ethAmount)+' ETH Safely. refresh your page! Your Balance is now  '+user.depositedBalance+'ETH',
                icon:'C:/Users/HasseneING/Downloads/iconUnchained.png',
                appID:'Unchained Tax Evasion',
              });
            } // done isnt real 
          })
        })
          .catch((err) => {
            console.log(err);
          });

      }
      else {
        console.log("failed");
      }
    },
  })
}

run().catch(console.error);

