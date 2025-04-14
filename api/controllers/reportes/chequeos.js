/**
 * NOTA: TENEMOS QUE TOMAR EN CUENTA EN EL RANGO DEL DIA
 * QUE YA SE TOMAN EN CUENTA LOS REGISTROS PASADOS
 * DE LAS 23:59:59, HAY QUE RECORDAR QUE PARA QUE SE PUEDA
 * REGISTRAR EL REPORTE DE SALIDA CON HORAS EXTRAS PASADAS
 * DE LA HORA YA ESTABLECIDA, SE TIENE QUE CHECAR DOS HORAS
 * ANTES DE LA HORA DE ENTRADA DEL SIGUIENTE DIA.
 */

// Modelos de la DB
const db = require("../../models/index");

// Codigos de la API.
const respuestas = require("../../utils/codigosAPI");

// Funciones del token
const {
    getTokenPayload
} = require('../../utils/jwtConfig')

// Instanciamos los codigos.
const CODIGOS = new respuestas.CodigoApp();

// Operadores de sequelize para consultas
const {
    Op
} = require("sequelize");

// Funciones de manipulacion de tiempo.
const {
    rangoDia,
    rangoSemana,
    deserealizarSemana,
    rangoReporteDiaLaboral
} = require("../../utils/tiempo");

// Funciones extra.
const {
    mostrarLog
} = require("../../utils/logs");

// Modelos que usara el controlador.
const Reportes = db.reporte;
const Horarios = db.horario;
const Empleados = db.empleado;
const TiposReportes = db.tipoReporte;
const DiasLaborales = db.diaLaboral;
const ReportesChequeos = db.reporteChequeo;

// Genera un reporte de chequeo de entrada y salida, así como el inico
// y fin del descanso.
module.exports = async function reporteChequeos(
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
        const payload = await getTokenPayload(
            cabecera.authorization
        );

        // Verificamos que el payload sea valido.
        if(!payload) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.TOKEN_INVALIDO
            });
        }

        // Construimos la consulta hacia la db.
        const datos = Object();

        // Instanciamos la fecha actual.
        const hoy = new Date();

        // Instanciamos la semana del reporte.
        const semanaReporte = consulta.semanaReporte? deserealizarSemana(
            consulta.semanaReporte
        ) : rangoSemana(false);

        // Instanciamos el rango del dia del reporte.
        const rangoReporte = rangoDia(
            consulta.dia,
            semanaReporte
        );

        // Buscamos el registro vinculado del empleado.
        const registroVinculado = await Empleados.findOne({
            where: {
                id: consulta.idEmpleadoVinculado
            },
            include: [{
                model: Horarios
            }]
        });

        // Si el registro vinculado no existe.
        if(!registroVinculado) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.EMPLEADO_NO_ENCONTRADO
            });
        }

        // Consultamos el dia laboral.
        const registroDiaLaboral = await DiasLaborales.findOne({
            where: {
                idHorarioVinculado: registroVinculado.horario.id,
                dia: consulta.dia
            }
        });

        // Buscamos el tipo de reporte para entrada.
        const tipoReporteEntrada = await TiposReportes.findOne({
            where: {
                tagTipoReporte: 'chequeoEntrada'
            }
        });

        // Buscamos el tipo de reporte para entrada con retraso.
        const tipoReporteEntradaRetraso = await TiposReportes.findOne({
            where: {
                tagTipoReporte: 'chequeoEntradaRetraso'
            }
        });

        // Buscamos el tipo de reporte para salida.
        const tipoReporteSalida = await TiposReportes.findOne({
            where: {
                tagTipoReporte: 'chequeoSalida'
            }
        });

        // Buscamos el tipo de reporte para salida con horas extra.
        const tipoReporteSalidaExtras = await TiposReportes.findOne({
            where: {
                tagTipoReporte: 'chequeoSalidaExtras'
            }
        });

        // Si alguno de los registros no existe.
        if(!tipoReporteEntrada
            || !tipoReporteEntradaRetraso
            || !tipoReporteSalida
            || !tipoReporteSalidaExtras
        ) {
            // Retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Instanciamos el rango del reporte.
        const rangoDiaReporte =  rangoReporteDiaLaboral(
            consulta.dia,
            rangoDia(
                consulta.dia,
                semanaReporte,
                false
            ),
            registroDiaLaboral
        );

        // Consultamos el reporte de entrada.
        const reporteEntrada = await ReportesChequeos.findOne({
            where: {
                idEmpleadoVinculado: registroVinculado.id,
                fechaRegistroReporteChequeo: {
                    [Op.between]: rangoDiaReporte
                }
            },
            include: [{
                required: true,
                model: Reportes,
                where: {
                    idTipoReporteVinculado: {
                        [Op.or]: [
                            tipoReporteEntrada.id,
                            tipoReporteEntradaRetraso.id
                        ]
                    }
                },
                include: [{
                    model: TiposReportes
                }]
            }]
        });

        // Consultamos el reporte de salida.
        const reporteSalida = await ReportesChequeos.findOne({
            where: {
                idEmpleadoVinculado: registroVinculado.id,
                fechaRegistroReporteChequeo: {
                    [Op.between]: rangoDiaReporte
                }
            },
            include: [{
                required: true,
                model: Reportes,
                where: {
                    idTipoReporteVinculado: {
                        [Op.or]: [
                            tipoReporteSalida.id,
                            tipoReporteSalidaExtras.id
                        ]
                    }
                },
                include: [{
                    model: TiposReportes
                }]
            }]
        });

        // Calculamos el tiempo laboral total.
        const tiempoLaboralTotal = (!reporteEntrada || !reporteSalida)? 0 : (
            reporteSalida.fechaRegistroReporteChequeo
            - reporteEntrada.fechaRegistroReporteChequeo
        );

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            reporte: {
                salida: reporteSalida,
                entrada: reporteEntrada,
                tiempoLaboralTotal: tiempoLaboralTotal
            }
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
