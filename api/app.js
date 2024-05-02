// Librerias de terceros
const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");
const http = require('http');
const { Server } = require("socket.io");
var multer = require('multer');

// Para poder procesar form-data.
var upload = multer();

// Importa el ambiente en el que se trabaja.
require("dotenv").config();

// Variables del entorno.
const PORT = process.env.PORT;
const HOST = process.env.HOST;

// Instancia una app.
let app = express();

// Se configuran los request.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Se configura el frontend para recivir datos del backend.
app.use(cors({origin: "*"}));

// Aqui se agregan las rutas generales.
require("./routes/reporteDispositivoRoute")(app)
require("./routes/tipoDispositivoRoute")(app);
require("./routes/tipoReporteRoute")(app);
require("./routes/dispositivoRoute")(app);
require("./routes/diaLaboralRoute")(app);
require("./routes/dashboardRoute")(app);
require("./routes/empleadoRoute")(app);
require("./routes/horarioRoute")(app);
require("./routes/permisoRoute")(app);
require("./routes/reporteRoute")(app);
require("./routes/usuarioRoute")(app);
require("./routes/recursoRoute")(app);
require("./routes/rolRoute")(app);
require("./routes/IoTRoute")(app);
require("./routes/zonaRoute")(app);

// Instancia un objeto servidor.
const server = http.createServer(app);

// Se instancia el io para el socket.
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Aqui se agregan los eventos que puede manejar el socket.
require("./socketServer/manajerEventos")(io);

// Escuchamos sobre una IP y Puerto definido e instanciamos el servidor.
server.listen(PORT, HOST, (error) => {
    console.clear();

    if(error){
        return console.log(`---| Cannot listen on Port: ${PORT}`);
    }

    console.log(`---| Server is listening on: http://${HOST}:${PORT}/`);
});
