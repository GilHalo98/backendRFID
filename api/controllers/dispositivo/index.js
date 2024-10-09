// Funcion de carga dinamica de los controladores.
const {
    cargaDinamicaControladores
} = require('../../utils/controladores.js');

function cargaEstaticaControladores() {
    // Controladores a exportar.
    const controladores = {};

    // Importamos los controladores.
    const consultaDispositivo = require('./consultar.js');
    const eliminarDispositivo = require('./eliminar.js');
    const modificarDispositivo = require('./modificar.js');
    const registrarDispositivo = require('./registrar.js');
    const generarTokenAcceso = require('./generarToken.js');

    // Instanciamos una lista de las funciones de los controladores.
    const funciones = [
        consultaDispositivo,
        eliminarDispositivo,
        modificarDispositivo,
        registrarDispositivo,
        generarTokenAcceso
    ];

    // Asociamos las funciones de los controladores con los controladores.
    funciones.forEach(funcion => {
        controladores[funcion.name] = funcion;
    });

    return controladores;
};

// Funciones de los controladores.
// const controladores = cargaDinamicaControladores(__dirname);
const controladores = cargaEstaticaControladores();

// Exportamos los controladores.
module.exports = controladores;