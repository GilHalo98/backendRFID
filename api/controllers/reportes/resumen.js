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

const {
    contarContinuidadReprotes
} = require('../../utils/funcionesReportes');

// Modelos que usara el controlador.
const Zonas = db.zona;
const Reportes = db.reporte;
const Empleados = db.empleado;
const TiposReportes = db.tipoReporte;
const ReportesAccesos = db.reporteAcceso;
const DispositivosIoT = db.dispositivoIoT;
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
        const semanaReporte = consulta.semanaReporte?
            deserealizarSemana(consulta.semanaReporte) : null;

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

        /**
         * Consultamos los registros de los tipos de reportes a usar
         * para generar el reporte resumen.
        */

        // Consultamos el tipo de repote para acceso a zona.
        const tipoReporteAccesoZona = await TiposReportes.findOne({
            where: {
                tagTipoReporte: 'accesoGarantizado'
            }
        });

        // Consultamos el tipo de repote para salida de zona.
        const tipoReporteSalidaZona = await TiposReportes.findOne({
            where: {
                tagTipoReporte: 'salidaZona'
            }
        });

        // Consultamos el tipo de repote para actividad iniciada.
        const tipoReporteActividadIniciada = await TiposReportes.findOne({
            where: {
                tagTipoReporte: 'actividadIniciada'
            }
        });

        // Consultamos el tipo de repote para actividad finalizada.
        const tipoReporteActividadFinalizada = await TiposReportes.findOne({
            where: {
                tagTipoReporte: 'actividadFinalizada'
            }
        });

        // Si alguno de los tipos de reporte no existe, entonces se
        // envia un mensaje de error.
        if(
            !tipoReporteAccesoZona
            || !tipoReporteActividadIniciada
            || !tipoReporteActividadFinalizada
            || !tipoReporteSalidaZona
        ) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        /**
         * Generamos un reporte de resumen de las actividades del
         * empleado, asi como de las zonas visitadas y el tiempo total
         * en actividad, en general.
        */

        // Instanciamos el reporte.
        const reporte = {
            accesos: {},
            actividades: {}
        };

        // Consultamos todas las zonas.
        const registrosZonas = await Zonas.findAll();

        // Por cada zona que existe.
        for (let i = 0; i < registrosZonas.length; i++) {
            // Desempaquetamos un registro de zona.
            const registroZona = registrosZonas[i];

            // Consultamos todos los registros.
            const registrosAccesos = await ReportesAccesos.findAll({
                where: {
                    idEmpleadoVinculado: consulta.idEmpleadoVinculado,
                    idZonaVinculada: registroZona.id,
                    fechaRegistroReporteAcceso: {
                        [Op.between]: rangoDiaReporte
                    },
                },
                include: [{
                    required: true,
                    model: Reportes,
                    where: {
                        idTipoReporteVinculado: {
                            [Op.or]: [
                                tipoReporteAccesoZona.id,
                                tipoReporteSalidaZona.id
                            ]
                        }
                    },
                    include: [{
                        model: TiposReportes
                    }]
                }],
                order: [['fechaRegistroReporteAcceso', 'DESC']]
            });

            // Contamos los ingresos y egresos a la zona.
            const conteo = await contarContinuidadReprotes(
                registrosAccesos.map((registro) => {
                    return registro.reporte.idTipoReporteVinculado;
                }),
                tipoReporteSalidaZona.id,   // Salida
                tipoReporteAccesoZona.id,    // Entrada
                0
            );

            // Si el conteo de los registros es mayor que 0, entonces
            // se agregan los accesos al reporte.
            if(conteo > 0) {
                // Guardamos el conteo de los reportes.
                reporte.accesos[
                    registroZona.nombreZona
                ] = conteo;
            }
        }

        // Consultamos todos los dispositivos.
        const registrosDispositivos = await DispositivosIoT.findAll();

        // Por cada dispositivo que existe.
        for (let i = 0; i < registrosDispositivos.length; i++) {
            // Desempaquetamos un registro de dispositivo.
            const registroDispositivo = registrosDispositivos[i];

            // Consultamos todos los registros.
            const registrosActividades = await ReportesActividades.findAll({
                where: {
                    idEmpleadoVinculado: consulta.idEmpleadoVinculado,
                    idDispositivoVinculado: registroDispositivo.id,
                    fechaRegistroReporteActividad: {
                        [Op.between]: rangoDiaReporte
                    },
                },
                include: [{
                    required: true,
                    model: Reportes,
                    where: {
                        idTipoReporteVinculado: {
                            [Op.or]: [
                                tipoReporteActividadIniciada.id,
                                tipoReporteActividadFinalizada.id
                            ]
                        }
                    },
                    include: [{
                        model: TiposReportes
                    }]
                }],
                order: [['fechaRegistroReporteActividad', 'DESC']]
            });

            // Contamos los inicios y fines de actividad.
            const conteo = await contarContinuidadReprotes(
                registrosActividades.map((registro) => {
                    return registro.reporte.idTipoReporteVinculado;
                }),
                tipoReporteActividadFinalizada.id,   // Fin
                tipoReporteActividadIniciada.id,    // Inicio
                0
            );

            // Si el conteo de los registros es mayor que 0, entonces
            // se agregan los accesos al reporte.
            if(conteo > 0) {
                // Guardamos el conteo de la continuidad de los reportes.
                reporte.actividades[
                    registroDispositivo.nombreDispositivo
                ] = conteo;
            }
        }

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