var ejs = require('ejs');
var express = require('express'), http = require('http');
var app = express();
var config = {};

var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    ReplSetServers = require('mongodb').ReplSetServers,
    ObjectID = require('mongodb').ObjectID,
    Binary = require('mongodb').Binary,
    GridStore = require('mongodb').GridStore,
    Grid = require('mongodb').Grid,
    Code = require('mongodb').Code,
    BSON = require('mongodb').pure().BSON;



app.configure('development', function(){
  app.use(express.errorHandler());
  config.port = process.env.PORT || 8080;
});

app.configure(function(){
  //app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
  // app.use(require('connect-assets')());
});


console.log("Starting on port "+config.port)

//var server = http.createServer(app);
//server.listen(config.port);


var server = app.listen(8080);
var io = require('socket.io').listen(server);

app.get('/', function (reseq, res) {
    res.render('index.ejs')
});


var dbs = new Array();

io.set('log level', 1);

io.sockets.on('connection', function (socket) {

  socket.on('connect',function(host,port) {
    dbs[socket] = new Db('test', new Server(host, port), { safe: false });

    dbs[socket].open(function(err, db) {
      var adminDb = db.admin();
      
      setInterval(function() {
        adminDb.serverStatus(function(err, info) {
          socket.emit('serverStatus',info);
        });
      },1000);

      setInterval(function() {
        db.collection('$cmd.sys.inprog').findOne(function (err, data) {
          if (err) { throw err; }
          socket.emit('inprog', data);
        });
      },1000);

    });

  });

  socket.on('disconnect', function() {

      console.log('Got disconnect!');

      if (dbs[socket]) {
        dbs[socket].close(function () {
          console.log("db disconnected");
        });

        var i = dbs.indexOf(socket);
        delete dbs[i];
      }

   });

});

