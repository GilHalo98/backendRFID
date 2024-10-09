// Funcion de carga dinamica de los controladores.
const {
    cargaDinamicaControladores
} = require('../../utils/controladores.js');

function cargaEstaticaControladores() {
    // Controladores a exportar.
    const controladores = {};

    // Importamos los controladores.
    const consultaEmpleado = require('./consultar.js');
    const eliminarEmpleado = require('./eliminar.js');
    const modificarEmpleado = require('./modificar.js');
    const registrarEmpleado = require('./registrar.js');
    const registrarEmpleadoCompleto = require('./registrarCompleto.js');
    const consultaEmpleadoCompleto = require('./consultarCompleto.js');
    const registrarEmpleadoCompletoConDescanso = require('./registrarCompletoConDescanso.js');
    const modificarEmpleadoCompletoConDescanso = require('./modificarCompletoConDescanso.js');

    // Instanciamos una lista de las funciones de los controladores.
    const funciones = [
        consultaEmpleado,
        eliminarEmpleado,
        modificarEmpleado,
        registrarEmpleado,
        registrarEmpleadoCompleto,
        consultaEmpleadoCompleto,
        registrarEmpleadoCompletoConDescanso,
        modificarEmpleadoCompletoConDescanso
    ];

    // Asociamos las funciones de los controladores con los controladores.
    funciones.forEach(funcion => {
        controladores[funcion.name] = funcion;
    });

    return controladores;
};

// Funciones de los controladores.
const controladores = cargaDinamicaControladores(__dirname);

// Exportamos los controladores.
module.exports = controladores;