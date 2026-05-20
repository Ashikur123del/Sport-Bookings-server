const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const { jwtVerify, createRemoteJWKSet } = require('jose-cjs'); 
require('dotenv').config();

const app = express();

app.use(express.json());

// 🚀 CORS কনফিগারেশন আরও নিখুঁত করা হলো যেন ফ্রন্টএন্ড থেকে রিকোয়েস্ট ব্লক না হয়
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
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

const FRONTEND_URL = process.env.CLIENT_URL || "http://localhost:3000";

// 🚀 চাবি খোঁজার সঠিক ইউআরএল (এখন এটি ফ্রন্টএন্ড ৩০০০ পোর্টে হিট করবে)
const JWKS = createRemoteJWKSet(new URL(`${FRONTEND_URL}/api/auth/jwks`));

const verifySportToken = async (req, res, next) => {
    const authHeader = req?.headers?.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send({ message: 'Unauthorized access! Token missing.' });
    }
    
    const token = authHeader.split(' ')[1];
    try {
        const { payload } = await jwtVerify(token, JWKS, {
            algorithms: ['EdDSA'],
        });
        req.user = payload; 
        next();
    } catch (error) {
        console.error("❌ Verification Error:", error.message);
        return res.status(403).send({ message: 'Forbidden access! Invalid token.' });
    }
};

async function run() {
  try {
   
    const db = client.db('Sport-Booking');
    const sportBookingCollection = db.collection('Sport-user');
    const bookingsCollection = db.collection('bookings');

    console.log("Pinged your deployment. You successfully connected to MongoDB!");

   
    app.get('/sport-user', async (req, res) => {
        try {
            const result = await sportBookingCollection.find().toArray();
            res.send(result);
        } catch (err) {
            res.status(500).send({ message: err.message });
        }
    });


    app.get('/sport-user/:sportId', verifySportToken, async (req, res) => {
        try {
            const { sportId } = req.params;
            const query = { _id: new ObjectId(sportId) };
            const result = await sportBookingCollection.findOne(query);
            if (!result) {
                return res.status(404).send({ message: "Facility not found!" });
            }
            res.send(result);
        } catch (err) {
            res.status(500).send({ message: err.message });
        }
    });

    app.post('/sport-user', async (req, res) => {
        const newFacility = req.body; 
        const result = await sportBookingCollection.insertOne(newFacility);
        res.send(result); 
    });

    app.patch('/sport-user/:id', async (req, res) => {
        const id = req.params.id;
        const updatedData = req.body;
        
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
            $set: {
                name: updatedData.name,
                facility_type: updatedData.facility_type,
                image: updatedData.image,
                location: updatedData.location,
                price_per_hour: updatedData.price_per_hour,
                capacity: updatedData.capacity,
                description: updatedData.description,
            }
        };

        const result = await sportBookingCollection.updateOne(filter, updateDoc);
        res.send(result);
    });


    app.delete('/sport-user/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await sportBookingCollection.deleteOne(query);
        res.send(result);
    });

    app.post('/booking', async (req, res) => {
        const bookingData = req.body;
        if (bookingData.facilityId) {
            bookingData.facilityId = new ObjectId(bookingData.facilityId);
        }
        const result = await bookingsCollection.insertOne(bookingData);
        res.send(result);
    });


    app.get('/my-bookings', verifySportToken, async (req, res) => {
        try {
            const email = req.user?.email; 
            const query = { userEmail: email }; 
            const result = await bookingsCollection.find(query).toArray();
            res.send(result);
        } catch (err) {
            res.status(500).send({ message: err.message });
        }
    });

  } catch (error) {
    console.error("MongoDB Connection Error:", error);
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Sports Booking Server is Running...");
});

app.listen(PORT, () => {
  console.log(`My Server Is Running On Port ${PORT}`);
});