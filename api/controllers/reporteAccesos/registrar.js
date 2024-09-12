// Modelos de la DB
const db = require("../../models/index");

// Codigos de la API.
const respuestas = require("../../utils/codigosAPI");

// Funciones del token
const {
    getTokenPayload
} = require('../../utils/jwtConfig')

// Instanciamos los codigos.
const CODIGOS = new respuestas.CodigoApp();

// Funcion para verificar que el registro exista en la DB.
const {
    existeRegistro
} = require("../../utils/registros");

// Funciones extra.
const {
    mostrarLog
} = require("../../utils/logs");

// Modelos que usara el controlador.
const Zonas = db.zona;
const Reportes = db.reporte;
const Empleados = db.empleado;
const ReportesAccesos = db.reporteAcceso;

// Guarda un registro en la base de datos.
module.exports = async function registrarReporteAcceso(
    request,
    respuesta
) {
    // POST Request.
    const cabecera = request.headers;
    const cuerpo = request.body;
    const parametros = request.params;

    try {
        // Desencriptamos el payload del token.
        const payload = await getTokenPayload(cabecera.authorization);

        // Verificamos que el payload sea valido.
        if(!payload) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.TOKEN_INVALIDO
            });
        }

        // Instanciamos la fecha del registro.
        const fecha = new Date();

        // Recuperamos la informacion del registro.
        const idReporteVinculado = cuerpo.idReporteVinculado;
        const idEmpleadoVinculado = cuerpo.idEmpleadoVinculado;
        const idZonaVinculada = cuerpo.idZonaVinculada;

        // Validamos que exista la informacion necesaria para
        // realizar el registro del empleado.
        if(
            ! idReporteVinculado
            || ! idZonaVinculada
            || ! idEmpleadoVinculado
        ) {
            // Si no estan completos mandamos
            // un mensaje de datos incompletos.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            });
        }

        // Si no existe el registro vinculado.
        if(! await existeRegistro(Reportes, idReporteVinculado)) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Si no existe el registro vinculado.
        if(! await existeRegistro(Empleados, idEmpleadoVinculado)) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Si no existe el registro vinculado.
        if(! await existeRegistro(Zonas, idZonaVinculada)) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Creamos el registro.
        const nuevoRegistro = {
            idReporteVinculado: idReporteVinculado,
            idZonaVinculada: idZonaVinculada,
            idEmpleadoVinculado: idEmpleadoVinculado,
            fechaRegistroReporteAcceso: fecha
        };

        // Guardamos el registro en la DB.
        await ReportesAccesos.create(nuevoRegistro);

        // Retornamos una respuesta de exito.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK
        });
        
    } catch(excepcion) {
        // Mostramos el error en la consola
        mostrarLog(`Error con controlador: ${excepcion}`);

        // Retornamos un codigo de error.
        return respuesta.status(500).send({
            codigoRespuesta: CODIGOS.API_ERROR
        });
    }
};