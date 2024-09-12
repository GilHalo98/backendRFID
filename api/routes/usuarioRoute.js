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
        '../controllers/usuario'
    );

    // Consulta los registros de la DB.
    router.get(
        '/consultar',
        upload.any(),
        controlador.consultaUsuario
    );

    // Registra un dato en la DB.
    router.post(
        '/registrar',
        upload.any(),
        controlador.registrarUsuario
    );

    // Modifica un registro de la DB.
    router.put(
        '/modificar',
        upload.any(),
        controlador.modificarUsuario
    );

    // Elimina un registro de la DB.
    router.delete(
        '/eliminar',
        upload.any(),
        controlador.eliminarUsuario
    );

    // Retorna un token de login al usuario.
    router.post('/login', upload.any(), controlador.login);

    // Ruta general de empleados.
    app.use(process.env.API_URL + 'usuario', router);
};