// Modelos de la DB
const db = require("../../models/index");

// Codigos de la API.
const respuestas = require("../../utils/codigosAPI");

// Instanciamos los codigos.
const CODIGOS = new respuestas.CodigoApp();

// Para la creacion y lectura de tokens.
const {
    getToken,
    getTokenPayload
} = require("..././utils/jwtConfig");

// Funciones extra.
const {
    mostrarLog
} = require("../../utils/logs");

// Modelos que usara el controlador.
const DispositivosIoT = db.dispositivoIoT;

module.exports = async function generarTokenAcceso(
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

        // Verificamos que el payload sea valido.
        if(!payload) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.TOKEN_INVALIDO
            });
        }

        // Si no se ingresa un id de registro.
        if(!consulta.id) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_BUSQUEDA_INCOMPLETOS
            });
        }

        // Buscamos el registro perteneciente.
        const registro = await DispositivosIoT.findByPk(consulta.id);

        // Si no se encontro el registro, retorna un mensaje.
        if(!registro) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DISPOSITIVO_IOT_NO_ENCONTRADO
            });
        }

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            authorization: getToken({
                'idDispositivo': registro.id
            }, {})
        });

    } catch(excepcion){
        mostrarLog(`Error con controlador: ${excepcion}`);

        return respuesta.status(500).send({
            codigoRespuesta: CODIGOS.API_ERROR
        });
    }
};