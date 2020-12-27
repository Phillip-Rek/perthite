const express = require("express");
const app = express();
const photon = require("../src/photon")
const fs = require("fs")


app.engine(photon, (err) => console.log("cannot resolve engine \n" + err))

let gb = photon.render({
    srcFile: __dirname + "/views/main.html"
}, {
    user: "User-1",
    users: [{
            name: "User-1",
            lastname: "Last-N-1"
        },
        {
            name: "User-2",
            lastname: "Last-N-2"
        }
    ],
    complex: [
        [1, 2],
        [6, 7],
        [8, 9]
    ],
    concat: (param = "", param2 = "") => {
        return param + param2;
    }
});
console.log(gb)
app.get('/', (req, res) => {
    res.send(gb)
})

app.listen(3000, (err) => {
    return err && console.err(err) ||
        console.log("server started on port 3000")
})