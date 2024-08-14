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
    const controlador = require('../controllers/controladorReportes.js');

    // Consulta los registros de la DB.
    router.get(
        '/horasTrabajadas', 
        upload.any(),
        controlador.reporteHorasTrabajadas
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

    // Ruta general de reportes.
    app.use(process.env.API_URL + 'reportes', router);
};