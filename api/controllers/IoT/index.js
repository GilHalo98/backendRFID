// Funcion de carga dinamica de los controladores.
const {
    cargaDinamicaControladores
} = require('../../utils/controladores.js');

function cargaEstaticaControladores() {
    // Controladores a exportar.
    const controladores = {};

    // Importamos los controladores.
    const verificarAPI = require('./verificarAPI.js');
    const generarReporteChequeo = require('./registrarReporteChequeo.js');
    const registrarReporteAcceso = require('./registrarReporteAcceso.js');
    const validarRegistroEmpleado = require('./validarRegistroEmpleado.js');
    const registrarReporteInicioActividad = require('./registrarReporteInicioActividad.js');
    const registrarReporteChequeoConDescanso = require('./registrarReporteChequeoConDescanso.js');
    const registrarReporteEmpleadoInexistente = require('./registrarReporteEmpleadoInexistente.js');
    const registrarReporteErrorAutentificacion = require('./registrarReporteErrorAutentificacion.js');
    const registrarReporteFinaliacionActividad = require('./registrarReporteFinaliacionActividad.js');

    // Instanciamos una lista de las funciones de los controladores.
    const funciones = [
        verificarAPI,
        generarReporteChequeo,
        registrarReporteAcceso,
        validarRegistroEmpleado,
        registrarReporteInicioActividad,
        registrarReporteChequeoConDescanso,
        registrarReporteEmpleadoInexistente,
        registrarReporteErrorAutentificacion,
        registrarReporteFinaliacionActividad
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