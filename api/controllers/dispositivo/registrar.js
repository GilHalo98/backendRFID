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
} = require("..././utils/jwtConfig");

// Funciones extra.
const {
    mostrarLog
} = require("../../utils/logs");

// Modelos que usara el controlador.
const TiposDispositivos = db.tipoDispositivo;
const DispositivosIoT = db.dispositivoIoT;
const Zonas = db.zona;

// Genera un reporte de intentos de accesos a zonas.
module.exports = async function registrarDispositivo(
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

        // Recuperamos los datos del registro.
        const descripcionDispositivo = cuerpo.descripcionDispositivo;
        const idZonaVinculada = cuerpo.idZonaVinculada;
        const idTipoDispositivoVinculado = cuerpo.idTipoDispositivoVinculado;

        // Verificamos que los datos recuperados sean validos para el registro.
        if(
            !descripcionDispositivo
            || !idZonaVinculada
            || !idTipoDispositivoVinculado
        ) {
            // Si alguno de los datos no es valido, no se realiza el registro.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            });
        }

        // Ahora buscamos por el registro vinculado al dispositivo.
        const zonaVinculada = await Zonas.findByPk(
            idZonaVinculada
        );

        // Si no existe el registro vinculado.
        if(!zonaVinculada) {
            // Retorna el mensaje de dato vinculado no existe.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Vericiamos que el registro vinculado exista.
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

        // Ahora realizamos el registro del reporte.
        const dispositivoNuevo = {
            descripcionDispositivo: descripcionDispositivo,
            fechaRegistroIoT: fecha,
            idZonaVinculada: idZonaVinculada,
            idTipoDispositivoVinculado: idTipoDispositivoVinculado
        };

        // Registramos el reporte en la base de datos.
        await DispositivosIoT.create(dispositivoNuevo);

        // Retornamos un mensaje de ok.
        return respuesta.status(200).json({
            codigoRespuesta: CODIGOS.OK
        });

    } catch(excepcion) {
        // Mostramos la excepción en la consola.
        mostrarLog(`Error con controlador: ${excepcion}`);

        // Retornamso el codigo del error de la api.
        return respuesta.status(500).send({
            codigoRespuesta: CODIGOS.API_ERROR
        });
    }
};