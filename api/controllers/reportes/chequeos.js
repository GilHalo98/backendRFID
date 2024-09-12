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
const Reportes = db.reporte;
const Empleados = db.empleado;
const TiposReportes = db.tipoReporte;
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

        // Consultamos el reporte de entrada.
        const reporteEntrada = await ReportesChequeos.findOne({
            where: {
                fechaRegistroReporteChequeo: {
                    [Op.between]: rangoDiaReporte
                }
            },
            include: [{
                required: true,
                model: Reportes,
                where: {
                    idTipoReporteVinculado: {
                        [Op.or]: [8, 9]
                    }
                },
                include: [{
                    model: TiposReportes
                }]
            }]
        });

        // Consultamos el reporte de inicio de descanso.
        const reporteInicioDescanso = await ReportesChequeos.findOne({
            where: {
                fechaRegistroReporteChequeo: {
                    [Op.between]: rangoDiaReporte
                }
            },
            include: [{
                required: true,
                model: Reportes,
                where: {
                    idTipoReporteVinculado: 15
                },
                include: [{
                    model: TiposReportes
                }]
            }]
        });

        // Consultamos el reporte de fin de descanso.
        const reporteFinDescanso = await ReportesChequeos.findOne({
            where: {
                fechaRegistroReporteChequeo: {
                    [Op.between]: rangoDiaReporte
                }
            },
            include: [{
                required: true,
                model: Reportes,
                where: {
                    idTipoReporteVinculado: 16
                },
                include: [{
                    model: TiposReportes
                }]
            }]
        });

        // Consultamos el reporte de salida.
        const reporteSalida = await ReportesChequeos.findOne({
            where: {
                fechaRegistroReporteChequeo: {
                    [Op.between]: rangoDiaReporte
                }
            },
            include: [{
                required: true,
                model: Reportes,
                where: {
                    idTipoReporteVinculado: {
                        [Op.or]: [10, 11]
                    }
                },
                include: [{
                    model: TiposReportes
                }]
            }]
        });

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            reporte: {
                salida: reporteSalida,
                entrada: reporteEntrada,
                finDescanso: reporteFinDescanso,
                inicioDescanso: reporteInicioDescanso
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