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
        '../controllers/dashboard'
    );

    // Genera un reporte de los accesos del día.
    router.get(
        '/accesos/porDia',
        upload.any(),
        controlador.accesosPorDia
    );

    // Genera un reporte de las activdades de la maquina.
    router.get(
        '/actividadMaquina',
        upload.any(),
        controlador.actividadDeMaquina
    );

    // Ruta general de reportes.
    app.use(process.env.API_URL + 'dashboard', router);
};