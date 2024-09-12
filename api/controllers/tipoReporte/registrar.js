// Modelos de la DB
const db = require("../../models/index");

// Codigos de la API.
const respuestas = require("../../utils/codigosAPI");

// Instanciamos los codigos.
const CODIGOS = new respuestas.CodigoApp();

// Para la creacion y lectura de tokens.
const {
    getTokenPayload
} = require("../../utils/jwtConfig");

// Funciones extra.
const {
    mostrarLog
} = require("../../utils/logs");

// Modelos que usara el controlador.
const TiposReportes = db.tipoReporte;

// Guarda un registro en la base de datos.
module.exports = async function registrarTipoReporte(
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
        const nombreTipoReporte = cuerpo.nombreTipoReporte;
        const descripcionTipoReporte = cuerpo.descripcionTipoReporte;

        // Validamos que exista la informacion necesaria para
        // realizar el registro del tipoReporte.
        if(
            !nombreTipoReporte
            || !descripcionTipoReporte
        ) {
            // Si no estan completos mandamos
            // un mensaje de datos incompletos.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            })
        }

        // Buscamos que no exista otro registro con los mismos datos.
        const coincidencia = await TiposReportes.count({
            where: {
                descripcionTipoReporte: descripcionTipoReporte
            }
        });

        // Si existe un registro con los mismos datos terminamos
        // la operacion.
        if(coincidencia) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_YA_EXISTE
            });
        }

        // Creamos el registro.
        const nuevoTipoReporte = {
            nombreTipoReporte: nombreTipoReporte,
            descripcionTipoReporte: descripcionTipoReporte,
            fechaRegistroTipoReporte: fecha
        };

        // Guardamos el registro en la DB.
        await TiposReportes.create(nuevoTipoReporte);

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