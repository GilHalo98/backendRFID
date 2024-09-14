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
const TiposReportes = db.tipoReporte;
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

        // Instanciamos la fecha del registro.
        const fecha = new Date();

        // Desempaquetamos el payload.
        const idDispositivo = payload.idDispositivo;

        // Recuperamos los datos del reporte.
        const resolucion = (!cuerpo.resolucion?
            cuerpo.resolucion : parseInt(cuerpo.resolucion)
        );

        // Recuperamos los datos del registro.
        const idEmpleadoVinculado = cuerpo.idEmpleadoVinculado;

        // Verificamos que existan los datos para generar el registro.
        if(!idEmpleadoVinculado) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            })
        }

        // Verificamos que exista el registro del dispositivo.
        const registroVinculadoDispositivo = await DispositivosIoT.findByPk(
            idDispositivo
        );

        // Si no existe, retornamos un mensaje de error.
        if(!registroVinculadoDispositivo) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Verificamos que exista el registro del empleado.
        const registroVinculadoEmpleado = await Empleados.findByPk(
            idEmpleadoVinculado
        );

        // Si no existe, retornamos un mensaje de error.
        if(!registroVinculadoEmpleado) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Verificamos que el tipo de reporte exista.
        const registroVinculadoTipoReporte = await TiposReportes.findOne({
            where: {
                tagTipoReporte: 'actividadIniciada'
            }
        });

        // Si no existe, entonces retornamos un mensaje de error.
        if(!registroVinculadoTipoReporte) {
            return respuesta.statuis(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Instanciamos los datos del reporte.
        const descripcionReporte = resolucion?
            `Actividad iniciada por ${registroVinculadoEmpleado.nombres} ${registroVinculadoEmpleado.apellidoPaterno} ${registroVinculadoEmpleado.apellidoMaterno} en maquina ${registroVinculadoDispositivo.nombreDispositivo}` : `Credenciales invalidas de ${registroVinculadoEmpleado.nombres} ${registroVinculadoEmpleado.apellidoPaterno} ${registroVinculadoEmpleado.apellidoMaterno} para inicio de actividad en ${registroVinculadoDispositivo.nombreDispositivo}`;

        // Instanciamos los datos del reporte de la actividad.
        let idReporteVinculado = undefined;

        // Registramos el reporte.
        await Reportes.create({
            descripcionReporte: descripcionReporte,
            fechaRegistroReporte: fecha,
            idTipoReporteVinculado: registroVinculadoTipoReporte.id

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