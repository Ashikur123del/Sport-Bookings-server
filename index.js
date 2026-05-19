
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8000;
const uri = process.env.MONGO_DB_URL;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server
    await client.connect();
    
    const db = client.db('Sport-Booking');
    const sportBookingCollection = db.collection('Sport-user');

    // 1. main get booking user
    app.get('/sport-user', async (req, res) => {
        const cursor = await sportBookingCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    });

    // 2. main get dynamic id
    app.get('/sport-user/:sportId', async (req, res) => {
        const { sportId } = req.params;
        const query = { _id: new ObjectId(sportId) };
        const result = await sportBookingCollection.findOne(query);
        res.send(result);
    });

    // 3. post api 
    app.post('/sport-user', async (req, res) => {
        const newFacility = req.body; 
        const result = await sportBookingCollection.insertOne(newFacility);
        res.send(result); 
    });


    // delete Api
app.delete('/sport-user/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await sportBookingCollection.deleteOne(query);
    res.send(result);
});





    // Ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
  }
}
run().catch(console.dir);

// Root Route
app.get("/", (req, res) => {
  res.send("Hello Home Page");
});

// Start Server
app.listen(PORT, () => {
  console.log(`My Server Is Running On Port ${PORT}`);
});
