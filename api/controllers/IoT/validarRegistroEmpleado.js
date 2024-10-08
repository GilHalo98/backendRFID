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

// Para verificar la existencia de un registro en la db.
const {
    existeRegistro
} = require("../../utils/registros");

// Funciones extra.
const {
    mostrarLog
} = require("../../utils/logs");

// Modelos que usara el controlador.
const Empleados = db.empleado;

// Valida la existencia del registro de un empleado.
module.exports = async function validarRegistroEmpleado(
    request,
    respuesta
) {
    // GET Request.
    const cabecera = request.headers;
    const cuerpo = request.body;
    const parametros = request.params;
    const consulta = request.query;

    try {
        // Desencriptamos el payload del token.
        const payload = await getTokenPayload(cabecera.authorization);

        // Verificamos que el paload sea valido.
        if(!payload) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.TOKEN_INVALIDO
            });
        }

        // Recuperamos los datos del cuerpo.
        const idEmpleadoVinculado = consulta.idEmpleadoVinculado;

        // Verificamos que existan los datos para realizar la busqueda.
        if(!idEmpleadoVinculado) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.DATOS_BUSQUEDA_INCOMPLETOS
            });
        }

        // Buscamos el registro del empleado.
        const registroEmpleado = await Empleados.findByPk(idEmpleadoVinculado);

        // Verificamos la existencia del registro.
        if(!registroEmpleado) {
            // Si el registro no existe, manda un mensaje de error.
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.EMPLEADO_NO_ENCONTRADO
            });
        }

        // Si el registro existe entonces manda un mensaje de OK.
        return respuesta.status(200).json({
            codigoRespuesta: CODIGOS.OK
        });

    } catch(excepcion) {
        // Mostramos la excepcion en la consola.
        mostrarLog(`Error con controlador: ${excepcion}`);

        // Retornamos el codigo de error con la api.
        return respuesta.status(500).json({
            codigoRespuesta: CODIGOS.API_ERROR
        });
    }
};