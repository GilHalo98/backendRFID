// Funcion de carga dinamica de los controladores.
const {
    cargaDinamicaControladores
} = require('../../utils/controladores.js');

function cargaEstaticaControladores() {
    // Controladores a exportar.
    const controladores = {};

    // Importamos los controladores.
    const consultaTipoDispositivo = require('./consultar.js');
    const eliminarTipoDispositivo = require('./eliminar.js');
    const modificarTipoDispositivo = require('./modificar.js');
    const registrarTipoDispositivo = require('./registrar.js');

    // Instanciamos una lista de las funciones de los controladores.
    const funciones = [
        consultaTipoDispositivo,
        eliminarTipoDispositivo,
        modificarTipoDispositivo,
        registrarTipoDispositivo
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