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

// Modifica un registro de la base de datos.
module.exports = async function modificarTipoReporte(
    request,
    respuesta
) {
    // PUT Request.
    const cabecera = request.headers;
    const cuerpo = request.body;
    const parametros = request.params;
    const consulta = request.query;

    try {
        // Desencriptamos el payload del token.
        const payload = await getTokenPayload(cabecera.authorization);

        // Verificamos que el payload sea valido.
        if(!payload) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.TOKEN_INVALIDO
            });
        }

        // Instanciamos la fecha de la modificacion del registro.
        const fecha = new Date();

        // Recuperamos la informacion del registro.
        const id = consulta.id;
        const nombreTipoReporte = cuerpo.nombreTipoReporte;
        const descripcionTipoReporte = cuerpo.descripcionTipoReporte;
        const tagTipoReporte = cuerpo.tagTipoReporte;

        // Verificamos que exista un id del registro a modificar.
        if(!id) {
            // Si no, retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_BUSQUEDA_INCOMPLETOS
            });
        }

        // Buscamos el registro.
        const tipoReporte = await TiposReportes.findByPk(id);

        // Verificamos que exista el registro.
        if(!tipoReporte) {
            // Si no se encontro el registro, se envia un
            // codio de registro inexistente.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.EMPLEADO_NO_ENCONTRADO,
            });
        }

        // Cambiamos los datos del registro.
        if(nombreTipoReporte) {
            tipoReporte.nombreTipoReporte = nombreTipoReporte;
        }
        if(descripcionTipoReporte) {
            tipoReporte.descripcionTipoReporte = descripcionTipoReporte;
        }
        if(tagTipoReporte) {
            // Buscamos por coincidencias en los registros
            // con el mismo targ
            const coincidencia = await TiposReportes.count({
                where: {
                    tagTipoReporte: tagTipoReporte
                }
            });

            // Si existe una coincidencia.
            if(coincidencia) {
                // Retornamos un mensaje de error.
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_YA_EXISTE
                });
            }
        }

        // Actualizamos la fehca de modificacion del registro.
        tipoReporte.fechaModificacionTipoReporte = fecha;

        // Guardamos los cambios.
        await tipoReporte.save();

        // Retornamos un mensaje de operacion ok.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK
        });

    } catch(excepcion) {
        // Mostramos el error en la consola
        mostrarLog(`Error con controlador: ${excepcion}`);

        // Retornamos un codigo de error.
        return respuesta.status(500).send({
            codigoRespuesta: CODIGOS.API_ERROR,
        });
    }
};