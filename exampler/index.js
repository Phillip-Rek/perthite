const { urlencoded } = require("express");
const express = require("express");
const app = express();
const perthite = require("../src/perthite")


app.engine('html', perthite.engine)
app.set('views', 'views')
app.set('view engine', 'html')

app.use(express.static(__dirname + "/public"))
app.use(urlencoded({ extended: true }))

app.get('/', function(req, res) {
    res.render('main', {
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
        },
        isString: (arg) => typeof arg === "string"
    })
})

app.post("/names/add/:name/:id/:msg", (req, res) => {
    console.log(req.body)
    res.send(req.params + req.body)
})


app.listen(3000, (err) => {
    return err && console.err(err) ||
        console.log("server started on port 3000")
})