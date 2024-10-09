// Funcion de carga dinamica de los controladores.
const {
    cargaDinamicaControladores
} = require('../../utils/controladores.js');

function cargaEstaticaControladores() {
    // Controladores a exportar.
    const controladores = {};

    // Importamos los controladores.
    const consultaUsuario = require('./consultar.js');
    const eliminarUsuario = require('./eliminar.js');
    const modificarUsuario = require('./modificar.js');
    const registrarUsuario = require('./registrar.js');
    const login = require('./login.js');

    // Instanciamos una lista de las funciones de los controladores.
    const funciones = [
        consultaUsuario,
        eliminarUsuario,
        modificarUsuario,
        registrarUsuario,
        login
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