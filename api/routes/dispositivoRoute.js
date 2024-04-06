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
    const IoT = require('../controllers/controladorDispositivo.js');

    // Genera un access token para el dispositivo.
    router.get('/generar/token', upload.any(), IoT.generarTokenAcceso);

    // Consulta los registros en la DB.
    router.get('/consultar', upload.any(), IoT.consultarDispositivo);

    // Registra un dispositivo en la DB.
    router.post(
        '/registrar/dispositivo',
        upload.any(),
        IoT.registrarDispositivo
    );

    // Modifica el registro en la DB.
    router.put('/modificar', upload.any(), IoT.modificarDispositivo);

    // Elimina el registro en la DB.
    router.delete('/eliminar', upload.any(), IoT.eliminarDispositivo);

    // Ruta general de usaurios.
    app.use(process.env.API_URL + 'dispositivo', router);
};
    