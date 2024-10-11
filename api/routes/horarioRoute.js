module.exports = (app) => {
    // Se importan las variables del ambiente.
    require('dotenv').config();

    // Libreria para el middleware de los request.
    const multer  = require('multer');
    
    // Instancia del middleware.
    const uploadForm = multer();

    // Enrutador de funciones.
    var router = require('express').Router();

    // Middleware para subida de archivos.
    const upload = require(
        "../middleware/fileUpload.js"
    );

    // Controlador del endpoint.
    const controlador = require(
        '../controllers/horario'
    );

    // Consulta los registros de la DB.
    router.get(
        '/consultar',
        uploadForm.any(),
        controlador.consultaHorario
    );

    // Registra un dato en la DB.
    router.post(
        '/registrar',
        uploadForm.any(),
        controlador.registrarHorario
    );

    // Modifica un registro de la DB.
    router.put(
        '/modificar',
        uploadForm.any(),
        controlador.modificarHorario
    );

    // Elimina un registro de la DB.
    router.delete(
        '/eliminar',
        uploadForm.any(),
        controlador.eliminarHorario
    );

    // Consulta un horario y sus dias laborales dado un empleado.
    router.get(
        '/consultar/completo',
        uploadForm.any(),
        controlador.consultaHorarioCompleto
    );

    // Modifica un horario de un empleado completo.
    router.put(
        '/modificar/completo',
        uploadForm.any(),
        controlador.modificarHorarioCompleto
    );

    // Modifica un horario de un empleado completo.
    router.put(
        '/modificar/completoConDescanso',
        uploadForm.any(),
        controlador.modificarHorarioCompletoConDescanso
    );
    // Ruta general de empleados.
    app.use(process.env.API_URL + 'horario', router);
};
