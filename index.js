const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const app = express();
const port = process.env.PORT || 5000;

// middlewares

app.use(cors());
app.use(express.json());

// Replace the uri string with your MongoDB deployment's connection string.
const uri = process.env.DB_URL;
const client = new MongoClient(uri);

async function run() {
    try {

        await client.connect();
        const database = client.db("pHeroBilling");
        const billsCollection = database.collection("bills");

        // console.log("connected");

        app.post("/api/add-billing", async (req, res) => {

            const bill = req.body;
            const inserted = await billsCollection.insertOne(bill);
            res.send({ success: true, inserted })

        })

        // get billings

        app.get("/api/billing-list", async (req, res) => {


            const bills = await billsCollection.find({}).toArray();
            res.send(bills)

        })


        // update billing
        app.get("/api/update-billing/:id", async (req, res) => {

            const { id } = req.params
            const data = req.body;

            const filter = {
                id: ObjectId(id)
            }
            const options = {upsert: true}

            const updateDoc = data;

            const result = await billsCollection.updateOne(filter,updateDoc,options);
            
            res.send(result);

        })

        // delete billing

        app.get("/api/delete-billing/:id", async (req, res) => {

            const { id } = req.params
            const filter = {
                id: ObjectId(id)
            }
      

            const result = await billsCollection.deleteOne(filter);
            
            res.send(result);

        })

    } finally {

    }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send("Hello server working fine")
})



app.listen(port, () => {
    console.log(`Server Running in http://localhost:${port}`)
});