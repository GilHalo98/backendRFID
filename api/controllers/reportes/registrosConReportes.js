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
const TiposReportes = db.tipoReporte;
const ReportesAccesos = db.reporteAcceso;
const ReportesActividades = db.reporteActividad;

// Busca los dispositivos y las zonas donde el empleado tenga reportes.
module.exports = async function registrosConReportes(
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

        // Consultamos todos los registros.
        const registrosAccesos = await ReportesAccesos.findAll({
            where: {
                idEmpleadoVinculado: consulta.idEmpleadoVinculado,
                fechaRegistroReporteAcceso: {
                    [Op.between]: rangoDiaReporte
                },
            },
            include: [{
                required: true,
                model: Reportes,
                where: {
                    idTipoReporteVinculado: 1
                },
                include: [{
                    model: TiposReportes
                }]
            }],
            order: [['fechaRegistroReporteAcceso', 'DESC']]
        });

        const idsZonas = [];
        registrosAccesos.forEach((registro) => {
            if(!idsZonas.includes(registro.idZonaVinculada)) {
                idsZonas.push(registro.idZonaVinculada);
            }
        });

        // Consultamos todos los registros.
        const registrosDispositivos = await ReportesActividades.findAll({
            where: {
                idEmpleadoVinculado: consulta.idEmpleadoVinculado,
                fechaRegistroReporteActividad: {
                    [Op.between]: rangoDiaReporte
                }
            },
            include: [{
                required: true,
                model: Reportes,
                where: {
                    idTipoReporteVinculado: {
                        [Op.or]: [12, 13]
                    }
                },
                include: [{
                    model: TiposReportes
                }]
            }],
            order: [['fechaRegistroReporteActividad', 'DESC']]
        });

        const idsDispositivos = [];
        registrosDispositivos.forEach((registro) => {
            if(!idsDispositivos.includes(registro.idDispositivoVinculado)) {
                idsDispositivos.push(registro.idDispositivoVinculado);
            }
        });

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            registrosDispositivos: idsDispositivos,
            registrosZonas: idsZonas
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