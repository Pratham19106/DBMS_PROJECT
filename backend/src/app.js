const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require("cors")
const userRoutes = require('./routes/users');
const vendorRoutes = require('./routes/vendors');
const commodityRoutes = require('./routes/commodities');
const userProfiles =  require("./routes/userProfiles")
const registerAndLoginRoutes = require('./routes/registerAndLogin')
const { errorHandler } = require('./middlewares/errorHandler');
const app = express();
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const port = process.env.PORT || 3000
app.use(registerAndLoginRoutes);
app.use(userRoutes);
app.use(vendorRoutes);
app.use(commodityRoutes);
app.use(userProfiles);

app.get('/', (req, res) => {
    res.status(200).json({ msg: "server is running" })
})


app.use(errorHandler)
app.listen(port, () => {
    console.log(`SERVER IS RUNNING ON PORT ${port}`)
})
