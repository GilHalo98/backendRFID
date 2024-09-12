/**
 * Reportes que pueden realizar los dispositivos son:
 *
 *  reporteDeDispositivo:
 *      empleado invalido
 *      tarjeta invalida
 *      uso de dispositivo
 *
 *  reporteAcceso:
 *      acceso a zona
 *
 *  reporteChequeo:
 *      chequeo de empleado
 */

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
    const IoT = require(
        '../controllers/IoT'
    );

    // Registra un reporte de acceso.
    router.post(
        '/registrar/reporte/acceso',
        IoT.registrarReporteAcceso
    );

    // Registramos un reporte de erro de autentificacion de tarjeta.
    router.post(
        '/registrar/reporte/errorAutentificacionTarjeta',
        upload.any(),
        IoT.registrarReporteErrorAutentificacion
    );

    // Validamos el registro de un empleado en la DB.
    router.get(
        '/validar/registro/empleado',
        upload.any(),
        IoT.validarRegistroEmpleado
    );

    // Registra un reporte de empleado inexistente.
    router.post(
        '/registrar/reporte/empleadoInexistente',
        upload.any(),
        IoT.registrarReporteEmpleadoInexistente
    );

    // Registra un reporte de chequeo del empleado.
    router.post(
        '/registrar/reporte/chequeo',
        upload.any(),
        IoT.registrarReporteChequeo
    );

    // Registra un reporte de inicio de actividad.
    router.post(
        '/registrar/reporte/actividad/iniciada',
        upload.any(),
        IoT.registrarReporteInicioActividad
    );

    // Registra un reporte de finalizacion de actividad.
    router.post(
        '/registrar/reporte/actividad/finalizada',
        upload.any(),
        IoT.registrarReporteFinaliacionActividad
    );

    // Validamos el registro de un empleado en la DB.
    router.get(
        '/verificar/api',
        upload.any(),
        IoT.verificarAPI
    );

    // Ruta general de usaurios.
    app.use(process.env.API_URL + 'IoT', router);
};
