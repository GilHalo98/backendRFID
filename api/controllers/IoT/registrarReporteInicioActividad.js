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
const DispositivosIoT = db.dispositivoIoT;
const ReportesActividades = db.reporteActividad;

// Registra un reporte de actividad iniciada.
module.exports = async function registrarReporteInicioActividad (
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

        // Verificamos que el paload sea valido.
        if(!payload) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.TOKEN_INVALIDO
            });
        }

        // Instanciamos la fecha del registro.
        const fecha = new Date();

        // Recuperamos los datos del reporte.
        const resolucion = (!cuerpo.resolucion ? cuerpo.resolucion : parseInt(
            cuerpo.resolucion
        ));

        // Recuperamos los datos del registro.
        const descripcionReporte = resolucion?
            "Actividad iniciada": "Credenciales invalidas para inicio de actividad";

        const idEmpleadoVinculado = cuerpo.idEmpleadoVinculado;

        const idTipoReporteVinculado = resolucion? 12 : 14; // 14

        /*Esto se sacara del payload*/
        const idDispositivo = payload.idDispositivo;

        // Verificamos que existan los datos para generar el registro.
        if(!idEmpleadoVinculado) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            })
        }

        // Verificamos que exista el registro del empleado.
        if(! await existeRegistro(Empleados, idEmpleadoVinculado)) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Verificamos que el registro del dispositivo exista.
        const dispositivo = await DispositivosIoT.findByPk(idDispositivo);

        // Si el registro no existe, retornamos un error.
        if(!dispositivo) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Instanciamos los datos del reporte de la actividad.
        let idReporteVinculado = undefined;

        // Registramos el reporte.
        await Reportes.create({
            descripcionReporte: descripcionReporte,
            fechaRegistroReporte: fecha,
            idTipoReporteVinculado: idTipoReporteVinculado

        }).then((registro) => {
            idReporteVinculado = registro.id;
        });

        // Registramos el reporte de la actividad.
        await ReportesActividades.create({
            fechaRegistroReporteActividad: fecha,
            idReporteVinculado: idReporteVinculado,
            idEmpleadoVinculado: idEmpleadoVinculado,
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