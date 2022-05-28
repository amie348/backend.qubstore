const app = require('./app');
const dotenv = require('dotenv');
const mongoose = require('mongoose');


dotenv.config({
    path: './vars/config.env'
});

const port = process.env.PORT || 8080;


mongoose
    .connect(process.env.DBCONNECTION, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
    }).then(() => {
        console.log("database connection successful...!!!");
        app.listen(port, () => {
            console.log(`App listening at :${port}`)
        });
    }).catch(console.log);
 


