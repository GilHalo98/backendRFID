module.exports = (app) => {
    // Se importan las variables del ambiente.
    require('dotenv').config();

    // Libreria para el middleware de los request.
    const multer  = require('multer');
    
    // Instancia del middleware.
    const uploadForm = multer();

    // Enrutador de funciones.
    var router = require('express').Router();

    // Controlador del endpoint.
    const controlador = require('../controllers/controladorEmpleado.js');

    // Middleware para subida de archivos.
    const upload = require("../middleware/fileUpload.js");

    // Consulta los registros de la DB.
    router.get('/consultar', uploadForm.any(), controlador.consultaEmpleado);

    // Registra un dato en la DB.
    router.post('/registrar', upload.single("file"), controlador.registrarEmpleado);

    // Modifica un registro de la DB.
    router.put('/modificar', upload.single("file"), controlador.modificarEmpleado);

    // Elimina un registro de la DB.
    router.delete('/eliminar', uploadForm.any(), controlador.eliminarEmpleado);

    // Ruta general de empleados.
    app.use(process.env.API_URL + 'empleado', router);
};
