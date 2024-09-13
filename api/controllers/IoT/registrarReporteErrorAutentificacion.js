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
const Reportes = db.reporte;
const TiposReportes = db.tipoReporte;
const DispositivosIoT = db.dispositivoIoT;
const ReportesDispositivos = db.reporteDispositivo;

// Registra un reporte.
module.exports = async function registrarReporteErrorAutentificacion(
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

        /*Esto se sacara del payload*/
        const idDispositivo = payload.idDispositivo;

        // Verificamos que el registro del dispositivo exista.
        const dispositivo = await DispositivosIoT.findByPk(idDispositivo);

        // Si el registro no existe, retornamos un error.
        if(!dispositivo) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Buscamos el registro del tipo de reporte.
        const registroVinculadoTipoReporte = await TiposReportes.findOne({
            where: {
                tagTipoReporte: 'tarjetaInvalida'
            }
        });

        // Si no existe el registro, entonces retorna un mensaje de rror.
        if(!registroVinculadoTipoReporte) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Recuperamos los datos del reporte.
        const descripcionReporte = `Error al autentificar tarjeta en dispositivo ${
            registroVinculadoDispositivo.nombreDispositivo
        }`;

        // Instanciamos los datos del reporte de error de autentificacion.
        let idReporteVinculado = undefined;

        // Registramos el reporte.
        await Reportes.create({
            descripcionReporte: descripcionReporte,
            fechaRegistroReporte: fecha,
            idTipoReporteVinculado: registroVinculadoTipoReporte.id

        }).then((registro) => {
            idReporteVinculado = registro.id;
        });

        // Registramos el reporte de error de autentificacion.
        await ReportesDispositivos.create({
            fechaRegistroReporteDispositivo: fecha,
            idReporteVinculado: idReporteVinculado,
            idDispositivoVinculado: idDispositivo
        });

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