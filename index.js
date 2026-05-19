
const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors')
require('dotenv').config()

const app = express();

app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 8000;

const uri = process.env.MONGO_DB_URL


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
  
    await client.connect();
   
    const db = client.db('Sport-Booking');
    const sportBookingCollection = db.collection('Sport-user')

    // main get booking user
    app.get('/sport-user', async(req, res) => {
        const cursor = await sportBookingCollection.find()
        const result = await cursor.toArray()
        res.send(result)
    })

    // main get dynamice id
    app.get('/sport-user/:sportId', async (req, res) => {
        const {sportId} = req.params
        const quary = {_id: new ObjectId(sportId)}
        const result = await sportBookingCollection.findOne(quary)
        res.send(result)

    })


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
   
    // await client.close();
  }
}
run().catch(console.dir);




app.get("/", (req, res) => {
  res.send("Hello Home Page");
});

app.listen(PORT, () => {
  console.log(`My Server Is Running On Port ${PORT}`);
});
