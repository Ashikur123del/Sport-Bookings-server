const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());

const allowedOrigins = [
  'http://localhost:3000',
  'https://sport-bookings-system.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

const PORT = process.env.PORT || 8000;
const uri = process.env.MONGO_DB_URL;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


const verifySportToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send({ message: 'Unauthorized! Token missing.' });
    }
    
    next();
};

async function run() {
  try {
    const db = client.db('Sport-Booking');
    const sportBookingCollection = db.collection('Sport-user');
    const bookingsCollection = db.collection('bookings');

    console.log("Connected to MongoDB Successfully!");

    app.get('/sport-user', async (req, res) => {
        const { search, facility_type, sort } = req.query;
        let query = {};
        
        if (search) query.name = { $regex: search, $options: 'i' }; 
        if (facility_type && facility_type !== 'All Sports') query.facility_type = facility_type;

        let sortOption = {};
        if (sort === 'asc') sortOption.price_per_hour = 1;
        if (sort === 'desc') sortOption.price_per_hour = -1;

        const result = await sportBookingCollection.find(query).sort(sortOption).toArray();
        res.send(result);
    });

    app.get('/sport-user/:sportId', async (req, res) => {
        try {
            const id = req.params.sportId;
            const query = { _id: new ObjectId(id) };
            const result = await sportBookingCollection.findOne(query);
            if (!result) {
                return res.status(404).send({ message: "Facility not found" });
            }
            res.send(result);
        } catch (error) {
            res.status(400).send({ message: "Invalid ID format" });
        }
    });

    app.post('/sport-user', async (req, res) => {
        const result = await sportBookingCollection.insertOne(req.body);
        res.send(result); 
    });

    app.patch('/sport-user/:id', async (req, res) => {
        const filter = { _id: new ObjectId(req.params.id) };
        const updateDoc = { $set: req.body };
        const result = await sportBookingCollection.updateOne(filter, updateDoc);
        res.send(result);
    });


    app.delete('/sport-user/:id', async (req, res) => {
        const query = { _id: new ObjectId(req.params.id) };
        const result = await sportBookingCollection.deleteOne(query);
        res.send(result);
    });

    app.post('/booking', verifySportToken, async (req, res) => {
        const bookingData = req.body;
        
        if (bookingData.facilityId) {
            bookingData.facilityId = new ObjectId(bookingData.facilityId);
        }
        
        const result = await bookingsCollection.insertOne(bookingData);
        res.send(result);
    });

  
app.get('/my-bookings', async (req, res) => {
    try {
        const email = req.query.email;
        if (!email) return res.status(400).json({ message: "Email required" });
        
        const result = await bookingsCollection.find({ userEmail: email }).toArray();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
});

  } catch (error) {
    console.error("MongoDB Error:", error);
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Sports Booking Server is Running...");
});

app.listen(PORT, () => {
  console.log(`Server Is Running On Port ${PORT}`);
});