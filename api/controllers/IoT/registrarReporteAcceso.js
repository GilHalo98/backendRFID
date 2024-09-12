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
const Reportes = db.reporte;
const Empleados = db.empleado;
const ReportesAccesos = db.reporteAcceso;
const DispositivosIoT = db.dispositivoIoT;

// Registra un reporte.
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

        // Recuperamos los datos del reporte.
        const resolucion = (
            !cuerpo.resolucion ? cuerpo.resolucion : parseInt(cuerpo.resolucion)
        );

        const idEmpleadoVinculado = cuerpo.idEmpleadoVinculado;

        // Verificamos que los datos para el registro del reporte esten
        // completos, sino es asi, retornamos un mensaje de error.
        if(!resolucion || !idEmpleadoVinculado) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            });
        }

        // Esto se sacara del payload
        const idDispositivo = payload.idDispositivo;

        // Si no existen el registro del empleado entoces retorna un error.
        if(! await existeRegistro(Empleados, idEmpleadoVinculado)) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Verificamos que el dispositivo este registrado en la DB.
        const registroDispositivo = await DispositivosIoT.findByPk(
            idDispositivo
        );

        // Si no es asi, entonces retorna un mensaje de error.
        if(!registroDispositivo) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Se inicializan los datos del registro del reporte.
        let descripcionReporte = undefined;
        let idTipoReporteVinculado = undefined;
        let idReporteVinculado = undefined;

        // Verificamos la resolucion de la peticion de acceso al area.
        if(resolucion) {
            // Si se le dio acceso a la zona, se genera un reporte de acceso
            // concedido.
            descripcionReporte = "Acceso concedido al empleado a zona";
            idTipoReporteVinculado = 1;

        } else {
            // De lo contrario se registra el reporte de acceso negado.
            descripcionReporte = "Acceso negado al empleado a zona";
            idTipoReporteVinculado = 2;
        }

        // Verifiamos que existan los datos para registrar el reporte.
        if(!descripcionReporte || !idTipoReporteVinculado) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            });
        }

        // Registramos el reporte.
        await Reportes.create({
            descripcionReporte: descripcionReporte,
            fechaRegistroReporte: fecha,
            idTipoReporteVinculado: idTipoReporteVinculado
        }).then((registro) => {
            idReporteVinculado = registro.id;
        });

        // Ahora registramos el reporte de acceso.
        await ReportesAccesos.create({
            fechaRegistroReporteAcceso: fecha,
            idReporteVinculado: idReporteVinculado,
            idEmpleadoVinculado: idEmpleadoVinculado,
            idZonaVinculada: registroDispositivo.idZonaVinculada
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