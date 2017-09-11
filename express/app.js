var express = require("express"),
    app     = express();


app.get("/", function(req, resp) {
  console.log(req.connection.peer);
  console.log(req.environment);
  resp.send("Hello world");
});

app.listen(4000, function() {
console.log("escuchando puerto 4000");
});
