// Funcion de carga dinamica de los controladores.
const {
    cargaDinamicaControladores
} = require('../../utils/controladores.js');

function cargaEstaticaControladores() {
    // Controladores a exportar.
    const controladores = {};

    // Importamos los controladores.
    const consultaHorario = require('./consultar.js');
    const eliminarHorario = require('./eliminar.js');
    const modificarHorario = require('./modificar.js');
    const registrarHorario = require('./registrar.js');
    const consultaHorarioCompleto = require('./consultarCompleto.js');
    const modificarHorarioCompleto = require('./modificarCompleto.js');

    // Instanciamos una lista de las funciones de los controladores.
    const funciones = [
        consultaHorario,
        eliminarHorario,
        modificarHorario,
        registrarHorario,
        consultaHorarioCompleto,
        modificarHorarioCompleto
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