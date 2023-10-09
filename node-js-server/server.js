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
/* The line `await consumer.subscribe({ topic: 'transaction-events', fromBeginning: false })` is
subscribing the consumer to the 'transaction-events' topic in the Kafka broker. This means that the
consumer will start receiving messages from that topic. The `fromBeginning` option is set to
`false`, which means that the consumer will start consuming messages from the latest offset (i.e.,
the most recent messages) in the topic. If `fromBeginning` was set to `true`, the consumer would
start consuming messages from the beginning of the topic. */
  await consumer.subscribe({ topic: 'transaction-events', fromBeginning: false })

 /* The code block you provided is using the `consumer.run()` method from the KafkaJS library to
 consume messages from the 'transaction-events' topic in the Kafka broker. */
  await consumer.run({
  /* The `eachMessage` function is a callback function that is executed for each message consumed from
  the Kafka topic. It receives three parameters: `topic`, `partition`, and `message`. */
    eachMessage: async ({ topic, partition, message }) => {
 
   /* This code block is checking if the status of a transaction is 'CONFIRMED'. If it is, it retrieves
   the amount of ETH transferred and the address of the recipient from the message received from the
   Kafka topic. */
      if (JSON.parse(message.value).details.status === 'CONFIRMED') {
        let ethAmount = Web3.utils.fromWei(JSON.parse(message.value).details.value, 'ether');
        let forwarderAddress = JSON.parse(message.value).details.to;
    /* This code block is finding a user in the database based on their `forwarderAddr` (forwarder
    address). Once the user is found, it calculates the new total balance by adding the `ethAmount`
    (amount of ETH transferred) to the current `depositedBalance` of the user. */
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
              notifier.notify({
                title: 'Thank you for Trusting us!',
                message: 'We recieved your Transfer of '+parseFloat(ethAmount)+' ETH Safely. refresh your page! Your Balance is now  '+user.depositedBalance+'ETH',
                icon:'C:/Users/HasseneING/Downloads/iconUnchained.png',
                appID:'Unchained Tax Evasion',
              });
            } 
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

