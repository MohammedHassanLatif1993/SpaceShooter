var async = require("async");
async.paraell ({
    function (callback) {
        console.log("one");
        callback();
    },
    function (callback) {
        console.log("two");
        callback();
    }
},
    function(err, result) {
    console.log("finished");
    })
