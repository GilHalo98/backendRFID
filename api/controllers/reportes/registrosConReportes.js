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
    verificarContinuidadReportes
} = require('../../utils/funcionesReportes');

// Modelos que usara el controlador.
const Zonas = db.zona;
const Reportes = db.reporte;
const TiposReportes = db.tipoReporte;
const ReportesAccesos = db.reporteAcceso;
const DispositivosIoT = db.dispositivoIoT;
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
        if(!tipoReporteAccesoZona
            || !tipoReporteActividadIniciada
            || !tipoReporteActividadFinalizada
            || !tipoReporteSalidaZona
        ) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Lista de ids de zonas con registros
        // de reportes vinculados.
        const idsZonas = [];

        // Lista de ids de dispositivos con registros 
        // de reportes vinculados-.
        const idsDispositivos = [];

        /**
         * Verificamos que minimo exista un reporte completo, esto es
         * entrada y salida de zona, por cada zona, si es asi, lo
         * agregamos a la lista de zonas con reportes vinculados, al
         * igual que con los reportes de actividad
        */

        // Consultamos todas las zonas.
        const registrosZonas = await Zonas.findAll();

        // Por cada zona que existe.
        for(let i = 0; i < registrosZonas.length; i++) {
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

            // Verificamos la continuidad de los reportes de
            // acceso a zona, esto es, que por cada reporte de entrada
            // le siga uno de salida.
            const continuidadEnReportesAcceso = await verificarContinuidadReportes(
                registrosAccesos.map((registro) => {
                    return registro.reporte.idTipoReporteVinculado;
                }),
                tipoReporteSalidaZona.id,   // Salida
                tipoReporteAccesoZona.id    // Entrada
            );

            // Si la zona tiene continuidad en los reportes
            // la agregamos a la lista de zonas con reportes.
            if(continuidadEnReportesAcceso) {
                idsZonas.push(registroZona.id);
            }
        }

        // Consultamos todos los dispositivos.
        const registrosDispositivos = await DispositivosIoT.findAll();

        // Por cada dispositivo que existe.
        for(let i = 0; i < registrosDispositivos.length; i++) {
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

            // Verificamos la continuidad de los reportes de
            // actividad, esto es, que por cada reporte de inicio de
            // actividad le siga uno de fin de actividad.
            const continuidadEnReportesActividad = await verificarContinuidadReportes(
                registrosActividades.map((registro) => {
                    return registro.reporte.idTipoReporteVinculado;
                }),
                tipoReporteActividadIniciada.id,   // Fin
                tipoReporteActividadFinalizada.id    // Inicio
            );

            // Si el dispositivo tiene continuidad en los reportes
            // la agregamos a la lista de dispositivos con reportes.
            if(continuidadEnReportesActividad) {
                idsDispositivos.push(registroDispositivo.id);
            }
        }

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
