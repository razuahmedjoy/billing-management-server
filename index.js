const express = require('express');
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

const app = express();
const port = process.env.PORT || 5000;

// middlewares

app.use(cors());
app.use(express.json());

// Replace the uri string with your MongoDB deployment's connection string.
const uri = process.env.DB_URL;
const client = new MongoClient(uri);

const verifyToken = (req, res, next) => {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized Access' })

    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Access Forbidden' });
        }
        req.decoded = decoded;
        console.log(req.decoded);
        next();
    })
}

async function run() {
    try {

        await client.connect();
        const database = client.db("pHeroBilling");
        const billsCollection = database.collection("bills");
        const usersCollection = database.collection("users");

        // console.log("connected");

        app.post('/api/login', async (req, res) => {

            const { email, password } = req.body;
            const user = await usersCollection.findOne({ email: email });
            if (user) {
                const isMatch = await bcrypt.compare(password, user.password);
                if (user.email === email && isMatch) {
                    const token = jwt.sign(user.email, process.env.JWT_SECRET_KEY);
                    const userData = {
                        email: user.email,
                        token: token
                    }
                    res.status(200).send({ "status": "success", "message": "Logged In SuccessFully", userData })
                }
                else {
                    res.send({ "status": "failed", "message": "Invalid Credential" })
                }
            }
            else {
                res.send({ "status": "failed", "message": "No user with this email" })
            }

        })
        app.post('/api/registration', async (req, res) => {
            const { email, password } = req.body;
            const exist = await usersCollection.findOne({ email: email });
            if (exist) {
                res.send({ "status": "failed", "message": "Already another account with this email" });
            }
            if (email && password) {

                try {
                    const salt = await bcrypt.genSalt(10);
                    const hashPassword = await bcrypt.hash(password, salt);
                    const createdUser = await usersCollection.insertOne({ email: email, password: hashPassword });

                    res.send({ "status": "success", "message": "Registration Success", createdUser });
                }
                catch (err) {
                    console.log(err.message)
                }
            }

        })

        // add new bills

        app.post("/api/add-billing", async (req, res) => {

            const bill = req.body;
            // console.log(bill)
            const inserted = await billsCollection.insertOne(bill);
            res.send({ success: true, inserted })
            // res.send("ok")

        })

        // get billings

        app.get("/api/billing-list", async (req, res) => {

            const { page } = req.query;
            if (page) {
                const bills = await billsCollection.find({}).skip(page * 10).limit(10).sort({ _id: -1 }).toArray()
                res.send(bills)
            }
            else {

                const bills = await billsCollection.find({}).sort({ _id: -1 }).toArray();
                res.send(bills)
            }




        })


        // update billing
        app.put("/api/update-billing/:id", async (req, res) => {

            const { id } = req.params
            const data = req.body;

            // console.log(id)
            // console.log(data)
            const filter = {
                _id: ObjectId(id)
            }
            const options = { upsert: true }

            const updateDoc = {
                $set: data
            };

            const result = await billsCollection.updateOne(filter, updateDoc, options);

            res.send(result);


        })

        // delete billing

        app.delete("/api/delete-billing/:id", async (req, res) => {

            const { id } = req.params
            const filter = {
                _id: ObjectId(id)
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