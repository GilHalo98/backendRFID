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
    deserealizarSemana
} = require("../../utils/tiempo");

// Funciones extra.
const {
    mostrarLog
} = require("../../utils/logs");

// Rutinas
const {
    existeRegistro
} = require("../../utils/registros");

// Modelos que usara el controlador.
const Reportes = db.reporte;
const Empleados = db.empleado;
const TiposReportes = db.tipoReporte;
const DispositivosIoT = db.dispositivoIoT;
const ReportesActividades = db.reporteActividad;

// Genera un repote de los operadores de la maquina.
module.exports = async function reporteOperadoresMaquina(
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

        // Construimos la consulta hacia la db.
        const datos = Object();

        // Agregamos los parametros de la consulta.
        if(consulta.idDispositivoVinculado) {
           datos.idDispositivoVinculado = consulta.idDispositivoVinculado; 
        }

        if(consulta.descripcionDispositivo) {
            datos.descripcionDispositivo = {
                [Op.like]: consulta.descripcionDispositivo
            };
        }

        // Inicializamos el rango de la semana a generar el reporte.
        if(consulta.semanaReporte) {
            datos.fechaRegistroReporteActividad = {
                [Op.between]: deserealizarSemana(
                    consulta.semanaReporte
                )
            };
        }

        // Verificamos que exista el registro.
        const existeRegistroDispositivo = await existeRegistro(
            DispositivosIoT,
            consulta.idDispositivoVinculado
        );

        // Verificamos los datos del registro.
        if(!existeRegistroDispositivo)  {
            // Retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Consultamos el tipo de repote para actividad inicada.
        const tipoReporteActividadIniciada = await TiposReportes.findOne({
            where: {
                tagTipoReporte: 'actividadIniciada'
            }
        });

        // Si alguno de los tipos de reporte no existe, entonces se
        // envia un mensaje de error.
        if(!tipoReporteActividadIniciada) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Consultamos el total de los registros.
        const totalRegistros = await ReportesActividades.count({
            where: datos,
            include: [{
                required: true,
                model: Reportes,
                where: {
                    idTipoReporteVinculado: tipoReporteActividadIniciada.id
                }
            }]
        });

        // Consultamos todos los registros.
        const registros = await ReportesActividades.findAll({
            offset: offset,
            limit: limit,
            where: datos,
            include: [{
                required: true,
                model: Reportes,
                where: {
                    idTipoReporteVinculado: tipoReporteActividadIniciada.id
                }
            }, {
                model: Empleados
            }],
            order: [['fechaRegistroReporteActividad', 'DESC']]
        });

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            totalRegistros: totalRegistros,
            registros: registros
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
