// Modelos de la DB
const db = require("../../models/index");

// Codigos de la API.
const respuestas = require("../../utils/codigosAPI");

// Instanciamos los codigos.
const CODIGOS = new respuestas.CodigoApp();

// Operadores de sequelize para consultas
const {
    Op
} = require("sequelize");

// Para la creacion y lectura de tokens.
const {
    getTokenPayload
} = require("../../utils/jwtConfig");

// Funciones extra.
const {
    rangoHoy
} = require("../../utils/tiempo");

const {
    mostrarLog
} = require("../../utils/logs");

// Modelos que usara el controlador.
const Roles = db.rol;
const Zonas = db.zona;
const Reportes = db.reporte;
const Empleados = db.empleado;
const TiposReportes = db.tipoReporte;
const ReportesAccesos = db.reporteAcceso;

// Genera un reporte de intentos de accesos a zonas.
module.exports = async function accesosPorDia(
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

        // Verificamos si se selecciono un offset.
        const offset = (
            !consulta.offset?
                consulta.offset : parseInt(consulta.offset)
        );

        // Verificamos si se selecciono un maximo de elementos por pagina.
        const limit = (
            !consulta.limit?
                consulta.limit : parseInt(consulta.limit)
        );

        // Consultamos el total de los registros.
        const totalRegistros = await ReportesAccesos.count({
            where: {
                fechaRegistroReporteAcceso: { 
                    [Op.between]: rangoHoy(),
                }
            },
        });

        // Consultamos los registros de los reportes de accesos,
        // los ordenamos de manera ascendente y unicamente buscamos los
        // que se encuentren en la fecha del dia actual.
        const registros = await ReportesAccesos.findAll({
            offset: offset,
            limit: limit,
            where: {
                fechaRegistroReporteAcceso: { 
                    [Op.between]: rangoHoy(),
                }
            },
            include: [{
                model: Empleados,
                include: [{
                    model: Roles
                }]
            }, {
                model: Reportes,
                include: [{
                    model: TiposReportes
                }]
            }, {
                model: Zonas
            }],
            order: [['fechaRegistroReporteAcceso', 'ASC']],
        });

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            registros: registros,
            totalRegistros: totalRegistros
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