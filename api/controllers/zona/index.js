// Libreria estandar para la manipulacion de directorios.
const {
    parse,
    join
} = require('path');

// Libreria estandar para la manipulacion de archivos.
const {
    readdirSync
} = require('fs');

// Controladores a exportar.
const controladores = {};

// Resolvemos el directorio de los controladores.
const directorioResuelto = __dirname;

// Consultamos todos los archivos en el directorio.
const archivos = readdirSync(directorioResuelto);

// Por cada archivo en le directorio.
archivos.forEach(archivo => {
    // Instanciamos el objeto archivo.
    const objetoArchivo = parse(archivo);

    // Si el archivo no es index y es un archivo javascript.
    if(objetoArchivo.name != 'index' && objetoArchivo.ext == '.js') {
        // Importamos el controlador.
        const controlador = require(
            join(directorioResuelto, objetoArchivo.name)
        );

        // Agregamos el controlador a la lista de controladores.
        controladores[controlador.name] = controlador;
    }
});

// Exportamos los controladores.
module.exports = controladores;