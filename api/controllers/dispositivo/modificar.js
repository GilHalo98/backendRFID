// Modelos de la DB
const db = require("../../models/index");

// Codigos de la API.
const respuestas = require("../../utils/codigosAPI");

// Instanciamos los codigos.
const CODIGOS = new respuestas.CodigoApp();

// Funcion para verificar que el registro exista en la DB.
const {
    existeRegistro
} = require("../../utils/registros");

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
module.exports = async function modificarDispositivo(
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
        const descripcionDispositivo = cuerpo.descripcionDispositivo;
        const idZonaVinculada = cuerpo.idZonaVinculada;
        const idTipoDispositivoVinculado = cuerpo.idTipoDispositivoVinculado;

        // Verificamos que exista un id del registro a modificar.
        if(!id) {
            // Si no, retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_BUSQUEDA_INCOMPLETOS
            });
        }

        // Buscamos el registro.
        const dispositivo = await DispositivosIoT.findByPk(id);

        // Si no se encuentra el registor, se retorna un mensaje.
        if(!dispositivo) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.DISPOSITIVO_IOT_NO_ENCONTRADO
            });
        }

        // Cambiamos los datos del registro.
        if(descripcionDispositivo) {
            dispositivo.descripcionDispositivo = descripcionDispositivo;
        }
        if(idZonaVinculada) {
            // Buscamos el registro vinculado.
            const zonaVinculada = await Zonas.findByPk(idZonaVinculada);

            // Si no se encuentra, se retorna un mensaje.
            if(!zonaVinculada) {
                return respuesta.status(200).json({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                });
            }

            // Cambiamos el registro vinculado.
            dispositivo.idZonaVinculada = idZonaVinculada;
        }
        if(idTipoDispositivoVinculado) {
            // Verificamos que el registro vinculado exista.
            const existeRegistroVinculadoTipoDispositivo = await existeRegistro(
                TiposDispositivos,
                idTipoDispositivoVinculado
            );

            // Si no existe.
            if(!existeRegistroVinculadoTipoDispositivo) {
                // Retornamos un mensaje de error.
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                });
            }

            // Cambiamos el registro vinculado.
            dispositivo.idTipoDispositivoVinculado = idTipoDispositivoVinculado;
        }


        // Actualizamos la fehca de modificacion del registro.
        dispositivo.fechaModificacionIoT = fecha;

        // Guardamos los cambios.
        await dispositivo.save();

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