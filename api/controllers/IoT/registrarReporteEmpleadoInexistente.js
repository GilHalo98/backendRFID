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

// Registra un reporte.
module.exports = async function registrarReporteEmpleadoInexistente(
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

        // Recuperamos los datos del reporte.
        const descripcionReporte = "Empleado inexistente detectado";
        const idTipoReporteVinculado = 5;

        /*Esto se sacara del payload*/
        const idDispositivo = payload.idDispositivo;

        // Instanciamos los datos del reporte del dispositivo.
        let idReporteVinculado = undefined;

        // Guardamos el registro en la DB.
        await Reportes.create({
            descripcionReporte: descripcionReporte,
            fechaRegistroReporte: fecha,
            idTipoReporteVinculado: idTipoReporteVinculado

        }).then((registro) => {
            idReporteVinculado = registro.id;
        });

        // Guardamos el reporte del dispositivo.
        await ReportesDispositivo.create({
            idRepoteVinculado: idReporteVinculado,
            idDispositivoVinculado: idDispositivo
        })

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