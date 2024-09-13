// Modelos de la DB
const db = require("../../models/index");

// Codigos de la API.
const respuestas = require("../../utils/codigosAPI");

// Instanciamos los codigos.
const CODIGOS = new respuestas.CodigoApp();

// Funcion para verificar que el registro exista en la DB.
const { existeRegistro } = require("../../utils/registros");

// Para la creacion y lectura de tokens.
const {
    getTokenPayload
} = require("../../utils/jwtConfig");

// Funciones extra.
const {
    mostrarLog
} = require("../../utils/logs");

// Modelos que usara el controlador.
const TiposDispositivos = db.tipoDispositivo;
const DispositivosIoT = db.dispositivoIoT;
const Zonas = db.zona;

// Genera un reporte de intentos de accesos a zonas.
module.exports = async function consultarDispositivo(
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
        
        // Verificamos si se selecciono un offset.
        const offset = (
            !consulta.offset?
                consulta.offset : parseInt(consulta.offset)
        );

        // Verificamos si se selecciono un maximo de elementos por pagina.
        const limit = (
            !consulta.limit?
                consulta.limit : parseInt(consulta.limit)
        );

        // Construimos la consulta hacia la db.
        const datos = Object();

        // Agregamos los parametros de la consulta.
        if(consulta.id) {
            datos.id = consulta.id;
        }

        if(consulta.nombreDispositivo) {
            datos.nombreDispositivo = consulta.nombreDispositivo;
        }

        if(consulta.idZonaVinculada) {
            // Buscamos en la db el registro vinculado.
            const zonaVinculada = await Zonas.findByPk(
                consulta.idZonaVinculada
            );

            // Si no existe.
            if(!zonaVinculada) {
                // Retornamos un mensaje de error.
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                });
            }

            // Si existe, se agrega el dato a la busqueda.
            datos.idZonaVinculada = consulta.idZonaVinculada;
        }

        if(consulta.idTipoDispositivoVinculado) {
            // Verificamos que exista el registro vinculado.
            const existeRegistroVinculadoTipoDispositivo = await existeRegistro(
                TiposDispositivos,
                consulta.idTipoDispositivoVinculado
            );

            // Si no existe.
            if(!existeRegistroVinculadoTipoDispositivo) {
                // Retornamos un mensaje de error.
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                });
            }

            // Si existe, se agrega el dato a la busqueda.
            datos.idTipoDispositivoVinculado = consulta.idTipoDispositivoVinculado;
        }

        // Consultamos el total de los registros.
        const totalRegistros = await DispositivosIoT.count({
            where: datos,
        });

        // Consultamos todos los registros.
        const registros = await DispositivosIoT.findAll({
            offset: offset,
            limit: limit,
            where: datos
        });

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            totalRegistros: totalRegistros,
            registros: registros
        });

    } catch(excepcion){
        mostrarLog(`Error con controlador: ${excepcion}`);

        return respuesta.status(500).send({
            codigoRespuesta: CODIGOS.API_ERROR
        });
    }
};