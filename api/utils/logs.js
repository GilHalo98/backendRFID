// Librerias de terceros
const fs = require("fs");

// Funcionalidad extra.
const {
    tiempoActual
} = require('./tiempo');

const guardarLog = async (log, tiempoLog) => {
    /*
    * Guardamos los logs en el sistema de archivos de logs del servidor.
    */

    // Directorio de logs del servidor.
    const LOG_DIR = process.env.LOG_DIR;

    // Concatenamos el nombre del archivo log.
    const nombreLog = `LOG-${
        tiempoLog.getYear()
    }${
        tiempoLog.getMonth()
    }${
        tiempoLog.getDay()
    }.log`;

    // Buscamos en el directorio de los logs si existe el archivo log.
    fs.appendFile(
        LOG_DIR + nombreLog,
        '[' + tiempoLog.toLocaleString() + ']' + log + '\n',
        () => {}
    );
};

const mostrarLog = async (log, guardarEnArchivo=true) => {
    // Generamos el tiempo actual.
    const tiempoLog = tiempoActual();

    console.log(
        '[' + tiempoLog.toLocaleString() + ']',
        log
    );

    if(guardarEnArchivo) {
        guardarLog(log, tiempoLog);
    }
};

module.exports = {
    mostrarLog
};
