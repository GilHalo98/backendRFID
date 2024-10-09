// Funcion de carga dinamica de los controladores.
const {
    cargaDinamicaControladores
} = require('../../utils/controladores.js');

function cargaEstaticaControladores() {
    // Controladores a exportar.
    const controladores = {};

    // Importamos los controladores.
    const reporteTracker = require('./tracker.js');
    const reporteResumen = require('./resumen.js');
    const reporteChequeos = require('./chequeos.js');
    const reporteUsosMaquina = require('./usosMaquina.js');
    const reporteIntentosAccesos = require('./accesos.js');
    const reporteAccesosZona = require('./accesosZonas.js');
    const reporteListarDiasHorario = require('./diasReportes.js');
    const reporteHorasTrabajadas = require('./horasTrabajadas.js');
    const reporteActividadMaquina = require('./actividadMaquina.js');
    const registrosConReportes = require('./registrosConReportes.js');
    const reporteActividadesDispositivo = require('./actividades.js');
    const reporteIntentosActividad = require('./intentosActividad.js');
    const reporteOperadoresMaquina = require('./operadoresMaquina.js');
    const reporteChequeosConDescanso = require('./chequeosConDescanso.js');
    const reporteGeneralHorasTrabajadas = require('./generalHorasTrabajadas.js');
    const reporteHorasTrabajadasConDescanso = require('./horasTrabajadasConDescanso.js');
    const reporteGeneralHorasTrabajadasConDescanso = require('./generalHorasTrabajadasConDescanso.js');



    // Instanciamos una lista de las funciones de los controladores.
    const funciones = [
        reporteTracker,
        reporteResumen,
        reporteChequeos,
        reporteUsosMaquina,
        reporteAccesosZona,
        registrosConReportes,
        reporteIntentosAccesos,
        reporteHorasTrabajadas,
        reporteActividadMaquina,
        reporteListarDiasHorario,
        reporteIntentosActividad,
        reporteOperadoresMaquina,
        reporteChequeosConDescanso,
        reporteActividadesDispositivo,
        reporteGeneralHorasTrabajadas,
        reporteHorasTrabajadasConDescanso,
        reporteGeneralHorasTrabajadasConDescanso
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