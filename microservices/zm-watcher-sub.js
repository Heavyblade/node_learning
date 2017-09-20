'use strict';

const zm = require("zeromq");
const subscriber = zm.socket("sub");

subscriber.subscribe('');

subscriber.on("message", function(data) {
    const message = JSON.parse(data);
    const date = new Date(message.timestamp);
    console.log(`File "${message.file}" changed at ${date}`);
});

subscriber.connect("tcp://localhost:60400");
