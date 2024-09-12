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
        '../controllers/diaLaboral'
    );

    // Registra un dato en la DB.
    router.post(
        '/registrar',
        upload.any(),
        controlador.registrarDiaLaboral
    );

    // Consulta los registros de la DB.
    router.get(
        '/consultar',
        upload.any(),
        controlador.consultaDiaLaboral
    );

    // Modifica un registro de la DB.
    router.put(
        '/modificar',
        upload.any(),
        controlador.modificarDiaLaboral
    );

    // Elimina un registro de la DB.
    router.delete(
        '/eliminar',
        upload.any(),
        controlador.eliminarDiaLaboral
    );

    // Ruta general de roles.
    app.use(process.env.API_URL + 'diaLaboral', router);
};
