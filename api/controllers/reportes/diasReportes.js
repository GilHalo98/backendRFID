// Modelos de la DB
const db = require("../../models/index");

// Codigos de la API.
const respuestas = require("../../utils/codigosAPI");

// Instanciamos los codigos.
const CODIGOS = new respuestas.CodigoApp();

// Operadores de sequelize para consultas
const {
    Op, DataTypes
} = require("sequelize");

// Para la creacion y lectura de tokens.
const {
    getTokenPayload
} = require("../../utils/jwtConfig");

// Funciones extra.
const {
    mostrarLog
} = require("../../utils/logs");

// Funciones de manipulacion del tiempo.
const {
    rangoDia,
    dateDiaSemana,
    deserealizarSemana,
} = require("../../utils/tiempo");

// Modelos que usara el controlador.
const Reportes = db.reporte;
const Horarios = db.horario;
const Empleados = db.empleado;
const DiasLaborales = db.diaLaboral;
const TiposReportes = db.tipoReporte;
const ReportesChequeos = db.reporteChequeo;

// Formateamos los datos de los registros.
async function formatearRegistros(
    registroEmpleado,
    diasLaborales,
    semanaReporte,
    hoy,
    tipoReporteEntrada,
    tipoReporteEntradaRetraso,
    tipoReporteSalida,
    tipoReporteSalidaExtras
) {
    // Lista de datos formateados.
    const datosFormateados = [];

    // Por cada registro de los dias laborales.
    for(let i = 0; i < diasLaborales.length; i ++) {
        // Desempaquetamos un registro de los dias laborales.
        const diaLaboral = diasLaborales[i];

        // Instanciamos la fecha del dia.
        const rangoDiaReporte = rangoDia(
            diaLaboral.dia,
            semanaReporte
        );

        // Instanciamos el dia de la semana.
        const diaSemana = dateDiaSemana(diaLaboral.dia, semanaReporte, true);

        // Consultamos el reporte de entrada.
        const reporteEntrada = await ReportesChequeos.findOne({
            where: {
                idEmpleadoVinculado: registroEmpleado.id,
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
                idEmpleadoVinculado: registroEmpleado.id,
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

        // Inicializamos los datos del reporte.
        let falto = false;
        let descansoLaborado = false;

        // Si el dia es descanso.
        if(diaLaboral.esDescanso) {
            // Si hay registros de entrada y salida
            if(reporteEntrada && reporteSalida) {
                // entonces se toma como un descanso laborado.
                descansosLaborados = true;
            }

        // Si el dia es uno normal.
        } else {
            // Si no hay registro de entrada y salida.
            if(!reporteEntrada && !reporteSalida) {
                // Se marca como falta.
                falto = true;
            }
        }

        // Guardamos el dato formateado en la lista.
        datosFormateados.push({
            dia: diaLaboral.dia,
            esDescanso: diaLaboral.esDescanso,
            falto: falto,
            diaFueraDeRango: diaSemana > hoy,
            descansoLaborado: descansoLaborado
        });
    }

    // Retornamos los datos formateados.
    return datosFormateados;
};

// Lista los dias del horario del empleado junto con una
// serie de banderas por dia.
module.exports = async function listarDiasHorario(request, respuesta) {
    // GET Request.
    const cabecera = request.headers;
    const cuerpo = request.body;
    const parametros = request.params;
    const consulta = request.query;

    try {
        // Desencriptamos el payload del token.
        const payload = await getTokenPayload(cabecera.authorization);

        // Verificamos que el payload sea valido.
        if(!payload) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.TOKEN_INVALIDO
            });
        }

        // Instanciamos la fecha del dia actual.
        const hoy = new Date();

        // Instanciamos la semana del reporte.
        const semanaReporte = deserealizarSemana(
            consulta.semanaReporte
        );

        // Desempaquetamos los datos.
        const idEmpleado = consulta.idEmpleado;

        // Si no se pasa el id del empleado.
        if(!idEmpleado) {
            // Se retorna un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_BUSQUEDA_INCOMPLETOS
            });
        }

        // Consultamos el registor del empleado.
        const registroEmpleado = await Empleados.findByPk(idEmpleado);

        // Si no se encuentra el registro de empleado.
        if(!registroEmpleado) {
            // Retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.EMPLEADO_NO_ENCONTRADO
            });
        }

        // Consultamos el registro del horario del empelado.
        const registroHorario = await Horarios.findOne({
            where: {
                idEmpleadoVinculado: registroEmpleado.id
            }
        });

        // Si no se encuentra registro del horario.
        if(!registroHorario) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.HORARIO_NO_ENCONTRADO
            });
        }

        // Por último buscamos los dias laborales del horario.
        const diasLaborales = await DiasLaborales.findAll({
            where: {
                idHorarioVinculado: registroHorario.id
            },
            order: [['dia', 'ASC']]
        });

        // Si no se encuentran los registros de los dias laborales.
        if(diasLaborales.length != 7) {
            // Retorna un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DIA_LABORAL_NO_ENCONTRADO
            });
        }

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

        // Procesamos los registros de los dias laborales.
        const listaDias = await formatearRegistros(
            registroEmpleado,
            diasLaborales,
            semanaReporte,
            hoy,
            tipoReporteEntrada,
            tipoReporteEntradaRetraso,
            tipoReporteSalida,
            tipoReporteSalidaExtras
        );

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            dias: listaDias
        });

    } catch(excepcion) {
        // Mostramos el error en la consola
        mostrarLog(`Error con controlador: ${excepcion}`);

        // Retornamos un codigo de error.
        return respuesta.status(500).send({
            codigoRespuesta: CODIGOS.API_ERROR,
        });
    }
};;