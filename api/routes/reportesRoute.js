module.exports = (app) => {
    // Se importan las variables del ambiente.
    require('dotenv').config();

    // Libreria para el middleware de los request.
    const multer  = require('multer');
    
    // Instancia del middleware.
    const upload = multer();

    // Enrutador de funciones.
    var router = require('express').Router();

    // Controlador del endpoint.
    const controlador = require(
        '../controllers/reportes'
    );

    // Consulta los registros de la DB.
    router.get(
        '/horasTrabajadas', 
        upload.any(),
        controlador.reporteHorasTrabajadas
    );

    // Consulta los registros de la DB de los reportes de
    // horas trabajadas por dias con descanso.
    router.get(
        '/horasTrabajadas/conDescanso', 
        upload.any(),
        controlador.reporteHorasTrabajadasConDescanso
    );

    // Consulta los registros de la DB.
    router.get(
        '/historial/actividad/maquina', 
        upload.any(),
        controlador.reporteActividadMaquina
    );

    // Consulta los registros de la DB.
    router.get(
        '/historial/usos/maquina', 
        upload.any(),
        controlador.reporteUsosMaquina
    );

    // Consulta los registros de la DB.
    router.get(
        '/historial/operadores/maquina', 
        upload.any(),
        controlador.reporteOperadoresMaquina
    );

    /**
     * Endpoints para los reportes de horas trabajadas.
     */

    // Genera un reporte general de las horas trabajadas del empleado.
    router.get(
        '/horasTrabajadas/detalles/general',
        upload.any(),
        controlador.reporteGeneralHorasTrabajadas
    );

    // Genera un reporte general de las horas trabajadas
    // con descansos del empleado.
    router.get(
        '/horasTrabajadas/detalles/general/conDescanso',
        upload.any(),
        controlador.reporteGeneralHorasTrabajadasConDescanso
    );

    // Genera un reporte de los movimientos del empelado.
    router.get(
        '/horasTrabajadas/detalles/tracker',
        upload.any(),
        controlador.reporteTracker
    );

    // Genera un reporte de los chequeos del empleado.
    router.get(
        '/horasTrabajadas/detalles/chequeos',
        upload.any(),
        controlador.reporteChequeos
    );

    // Genera un reporte de los chequeos del empleado
    // con chequeos de descanso.
    router.get(
        '/horasTrabajadas/detalles/chequeos/conDescanso',
        upload.any(),
        controlador.reporteChequeosConDescanso
    );

    // Genera un reporte resumen de las horas trabajadas del empleado.
    router.get(
        '/horasTrabajadas/detalles/resumen',
        upload.any(),
        controlador.reporteResumen
    );

    // Gener un reporte de los intentos de acceso del empleado.
    router.get(
        '/horasTrabajadas/detalles/intentos/accesos',
        upload.any(),
        controlador.reporteIntentosAccesos
    );

    // Genera un reporte de los intentos de inicio de actividad
    // del empleado.
    router.get(
        '/horasTrabajadas/detalles/intentos/actividad',
        upload.any(),
        controlador.reporteIntentosActividad
    );

    // Genera un reporte de los accesos a las zonas del empleado.
    router.get(
        '/horasTrabajadas/detalles/accesos/zona',
        upload.any(),
        controlador.reporteAccesosZona
    );

    // Genera un reporte de las actividades del empleado
    // en el dispositivo dado.
    router.get(
        '/horasTrabajadas/detalles/actividad/dispositivo',
        upload.any(),
        controlador.reporteActividadesDispositivo
    );

    // Lista de zonas y dispositivos donde el empleado
    // dado tiene reportes.
    router.get(
        '/horasTrabajadas/detalles/registrosConReportes',
        upload.any(),
        controlador.registrosConReportes
    );

    // Lista los dias del horario del empleado con un formato para
    // poder ponerlos sobre del navegador.
    router.get(
        '/horasTrabajadas/dias/horario',
        upload.any(),
        controlador.reporteListarDiasHorario
    )

    // Ruta general de reportes.
    app.use(process.env.API_URL + 'reportes', router);
};