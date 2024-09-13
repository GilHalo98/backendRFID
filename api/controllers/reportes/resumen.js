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
    deserealizarSemana,
    rangoDia
} = require("../../utils/tiempo");

// Funciones extra.
const {
    mostrarLog
} = require("../../utils/logs");

// Modelos que usara el controlador.
const Zonas = db.zona;
const Reportes = db.reporte;
const Empleados = db.empleado;
const ReportesAccesos = db.reporteAcceso;
const ReportesActividades = db.reporteActividad;

// Genera un reporte de resumen de los accesos totales, los inicios
// y fines de actividades y el total de horas en actividades.
module.exports = async function reporteResumen(
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

        // Instanciamos la semana del reporte.
        const semanaReporte = deserealizarSemana(
            consulta.semanaReporte
        );

        // Instanciamos el rango del dia del reporte.
        const rangoDiaReporte = rangoDia(
            consulta.dia,
            semanaReporte
        );

        // Buscamos el registro vinculado del empleado.
        const registroVinculado = await Empleados.findByPk(
            consulta.idEmpleadoVinculado
        );

        // Si el registro vinculado no existe.
        if(!registroVinculado) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.EMPLEADO_NO_ENCONTRADO
            });
        }

        // Instanciamos el reporte.
        const reporte = {
            accesos: {},
            actividades: {
                inicio: undefined,
                fin: undefined
            }
        };

        // Buscamos el tipo de reporte para el inicio de descanso.
        const tipoReporteInicioDescanso = await TiposReportes.findOne({
            where: {
                tagTipoReporte: 'chequeoInicioDescanso'
            }
        });

        // Buscamos el tipo de reporte para el fin de descanso.
        const tipoReporteFinDescanso = await TiposReportes.findOne({
            where: {
                tagTipoReporte: 'chequeoFinDescanso'
            }
        });

        // Si el registro vinculado no existe.
        if(!tipoReporteInicioDescanso || !tipoReporteFinDescanso) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Consultamos todas las zonas.
        const registrosZonas = await Zonas.findAll();

        // Por cada zona en los registros de zona.
        for (let i = 0; i < registrosZonas.length; i++) {
            // Instanciamos los registros.
            const registroZona = registrosZonas[i];

            // Consultamos los reportes de accesos por zona.
            const conteoReportes = await ReportesAccesos.count({
                where: {
                    idEmpleadoVinculado: consulta.idEmpleadoVinculado,
                    idZonaVinculada: registroZona.id,
                    fechaRegistroReporteAcceso: {
                        [Op.between]: rangoDiaReporte
                    }
                }
            });

            // Guardamos el conteo de accesos a la zona.
            reporte.accesos[registroZona.nombreZona] = conteoReportes;
        }

        // Realizamos el conteo de reportres de actividad iniciadas.
        const conteoReportesInicioActividad = await ReportesActividades.count({
            where: {
                idEmpleadoVinculado: consulta.idEmpleadoVinculado,
                fechaRegistroReporteActividad: {
                    [Op.between]: rangoDiaReporte
                }
            },
            inlcude: [{
                required: true,
                model: Reportes,
                where: {
                    idTipoReporteVinculado: tipoReporteInicioDescanso.id
                }
            }]
        });

        // Realizamos el conteo de reportres de actividad finalizadas.
        const conteoReportesFinActividad = await ReportesActividades.count({
            where: {
                idEmpleadoVinculado: consulta.idEmpleadoVinculado,
                fechaRegistroReporteActividad: {
                    [Op.between]: rangoDiaReporte
                }
            },
            inlcude: [{
                required: true,
                model: Reportes,
                where: {
                    idTipoReporteVinculado: tipoReporteFinDescanso.id
                }
            }]
        });

        // Guardamos los conteos en el reporte.
        reporte.actividades.inicio = conteoReportesInicioActividad;
        reporte.actividades.fin = conteoReportesFinActividad;

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            reporte: reporte
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