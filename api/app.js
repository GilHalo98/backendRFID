// Librerias de terceros
const fs = require("fs");
const bodyParser = require("body-parser");
const express = require("express");
const cors = require("cors");
const http = require('http');
const { Server } = require("socket.io");
var multer = require('multer');

// Incluimos las funciones propias
const { mostrarLog } = require("./utils/logs");

// Para poder procesar form-data.
var upload = multer();

// Importa el ambiente en el que se trabaja.
require("dotenv").config();

// Variables del entorno.
const PORT = process.env.PORT;
const HOST = process.env.HOST;

// Directorio de logs del servidor.
const LOG_DIR = process.env.LOG_DIR;
const RECURSOS_DIR = process.env.RECURSOS_DIR;

// Instancia una app.
let app = express();

// Se configuran los request.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Se configura el frontend para recivir datos del backend.
app.use(cors({origin: "*"}));

// Aqui se agregan las rutas generales.
require("./routes/reporteDispositivoRoute")(app);
require("./routes/reporteActividadRoute")(app);
require("./routes/tipoDispositivoRoute")(app);
require("./routes/reporteChequeoRoute")(app);
require("./routes/reporteAccesosRoute")(app);
require("./routes/tipoReporteRoute")(app);
require("./routes/dispositivoRoute")(app);
require("./routes/diaLaboralRoute")(app);
require("./routes/dashboardRoute")(app);
require("./routes/empleadoRoute")(app);
require("./routes/reportesRoute")(app);
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
        return mostrarLog(`Cannot listen on Port: ${PORT}`);
    }

    mostrarLog(`Server is listening on: http://${HOST}:${PORT}/`);

    /* Creamos los directorios a usar por el api. */

    // Si el directorio de los logs del servidor no existe.
    if(!fs.existsSync(LOG_DIR)) {
        // Creamos el directorio.
        fs.mkdirSync(LOG_DIR);

        mostrarLog('Directorio de logs creado exitosamente...');

    } else {
        mostrarLog('Directorio de logs cargado exitosamente...');
    }

    // Si el directorio de los recursos del servidor no existe.
    if(!fs.existsSync(RECURSOS_DIR)) {
        // Creamos el directorio.
        fs.mkdirSync(RECURSOS_DIR);

        mostrarLog('Directorio de recursos creado exitosamente...');

    } else {
        mostrarLog('Directorio de recursos cargado exitosamente...');
    }
});
