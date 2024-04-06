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
    const controlador = require('../controllers/controladorDashboard.js');

    // Consulta los registros de reportes de accesos recientes.
    router.get('/accesos', upload.any(), controlador.registrosRecientes);

    // Genera un reporte de los accesos del día.
    router.get('/accesos/porDia', upload.any(), controlador.accesosPorDia);

    // Genera un reporte por tipo.
    router.get('/reporte/porTipo', upload.any(), controlador.reportePorTipo);

    // Ruta general de reportes.
    app.use(process.env.API_URL + 'dashboard', router);
};