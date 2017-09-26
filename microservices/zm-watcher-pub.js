'use strict'

const fs        = require("fs"),
      zmq       = require("zeromq"),
      filename  = process.argv[2],
      publisher = zmq.socket("pub");

fs.watch(filename, () => {

    publisher.send(JSON.stringify({
        type: "changed",
        file: filename,
        timestamp: Date.now()
    }));

});

publisher.bind("tcp://*:60400", err => {
    if (err) {
        throw err;
    }

    console.log("Listen for zmq subscriber ...");
});

