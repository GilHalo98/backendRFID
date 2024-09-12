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
const ReportesAccesos = db.reporteAcceso;
const ReportesChequeos = db.reporteChequeo;
const ReportesActividades = db.reporteActividad;

// Genera un reporte de los registros de reportes para el tracket.
module.exports = async function reporteTracker(
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

        // Consultamos los registros de los reportes por empleado.
        const reporteChequeo = await ReportesChequeos.findAll({
            where: {
                idEmpleadoVinculado: consulta.idEmpleadoVinculado,
                fechaRegistroReporteChequeo: {
                    [Op.between]: rangoDiaReporte
                }
            },
            include: [{
                model: Reportes
            }]
        });

        const reporteAcceso = await ReportesAccesos.findAll({
            where: {
                idEmpleadoVinculado: consulta.idEmpleadoVinculado,
                fechaRegistroReporteAcceso: {
                    [Op.between]: rangoDiaReporte
                }
            },
            include: [{
                model: Reportes
            }]
        });

        const reporteActividades = await ReportesActividades.findAll({
            where: {
                idEmpleadoVinculado: consulta.idEmpleadoVinculado,
                fechaRegistroReporteActividad: {
                    [Op.between]: rangoDiaReporte
                }
            },
            include: [{
                model: Reportes
            }]
        });

        // Juntamos los reportes en una lista.
        const reportes = [
            ...reporteAcceso,
            ...reporteChequeo,
            ...reporteActividades
        ];

        // Ordenamos las fechas de los reportes de manera ascendente.
        reportes.sort((a, b) => {
            return(
                a.reporte.fechaRegistroReporte.getTime()
                - b.reporte.fechaRegistroReporte.getTime()
            );
        })

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            reporte: reportes.map((registro) => {
                return registro.reporte;
            })
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