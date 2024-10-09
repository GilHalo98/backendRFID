// Funcion de carga dinamica de los controladores.
const {
    cargaDinamicaControladores
} = require('../../utils/controladores.js');

function cargaEstaticaControladores() {
    // Controladores a exportar.
    const controladores = {};

    // Importamos los controladores.
    const consultaRecurso = require('./consultar.js');
    const eliminarRecurso = require('./eliminar.js');
    const modificarRecurso = require('./modificar.js');
    const registrarRecurso = require('./registrar.js');

    // Instanciamos una lista de las funciones de los controladores.
    const funciones = [
        consultaRecurso,
        eliminarRecurso,
        modificarRecurso,
        registrarRecurso
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