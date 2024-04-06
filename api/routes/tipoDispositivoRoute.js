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
    const controlador = require('../controllers/controladorTipoDispositivo.js');

    // Registra un dato en la DB.
    router.post('/registrar', upload.any(), controlador.registrarTipoDispositivo);

    // Consulta los registros de la DB.
    router.get('/consultar', upload.any(), controlador.consultaTipoDispositivo);

    // Modifica un registro de la DB.
    router.put('/modificar', upload.any(), controlador.modificarTipoDispositivo);

    // Elimina un registro de la DB.
    router.delete('/eliminar', upload.any(), controlador.eliminarTipoDispositivo);

    // Ruta general de tipos de reportes.
    app.use(process.env.API_URL + 'tipoDispositivo', router);
};