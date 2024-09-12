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
const Horarios = db.horario;
const Empleados = db.empleado;
const DiasLaborales = db.diaLaboral;
const TiposReportes = db.tipoReporte;
const ReportesChequeos = db.reporteChequeo;

// Genera un reporte general de la semana.
module.exports = async function reporteGeneralHorasTrabajadas(
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

        // Agregamos el id del registro a la consulta.
        if(consulta.idEmpleadoVinculado) {
            datos.idEmpleadoVinculado = consulta.idEmpleadoVinculado; 
        }

        // Instanciamos la semana del reporte.
        const semanaReporte = deserealizarSemana(
            consulta.semanaReporte
        );

        // Agregamos el rango de la semana a la consulta.
        if(consulta.semanaReporte) {
            datos.fechaRegistroReporteChequeo = {
                [Op.between]: semanaReporte
            };
        }

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

        // Buscamos el horairo vinculado del empleado.
        const horarioVinculado = await Horarios.findOne({
            where: {
                idEmpleadoVinculado: datos.idEmpleadoVinculado
            },
            include: [{
                model: DiasLaborales
            }],
        });

        // Si no existe un horario vinculado al empleado, abortamos la
        // operacion.
        if(!horarioVinculado) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.HORARIO_NO_ENCONTRADO
            });
        }

        // Verificamos que no existan registros de dias faltantes.
        if(horarioVinculado.diaLaborals.length != 7) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Instanciamos los datos del reporte general.
        const reporte = {
            tiempoTrabajoTotal: 0,
            tiempoDescansoTotal: 0,
            retraso: 0,
            faltas: 0,
            extras: 0,
            descansosLaborados: 0
        };

        // Por cada dia de la semana laboral.
        for(let i = 0; i < horarioVinculado.diaLaborals.length; i++) {
            // Instanciamos el dia laboral.
            const diaLaboral = horarioVinculado.diaLaborals[i];

            // Instanciamos la fecha del dia.
            const rangoDiaReporte = rangoDia(
                diaLaboral.dia,
                semanaReporte
            );

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

            // Si el dia es descanso.
            if(diaLaboral.esDescanso) {
                // Si hay registros de entrada y salida
                if(reporteEntrada && reporteSalida) {
                    // entonces se toma como un descanso laborado.
                    reporte.descansosLaborados ++;
                }

            // Si no es descanso.
            } else {
                // Si no hay registro de entrada y salida.
                if(!reporteEntrada && !reporteSalida) {
                    // Y no es un descanso.
                    if(!diaLaboral.esDescanso) {
                        // Se marca una falta.
                        reporte.faltas ++;
                    }

                // Si hay registro de entrada y salida.
                } if(reporteEntrada && reporteSalida) {
                    // Calculamos el tiempo laboradas.
                    reporte.tiempoTrabajoTotal += (
                        reporteSalida.fechaRegistroReporteChequeo.getTime()
                        - reporteEntrada.fechaRegistroReporteChequeo.getTime()
                    );

                    // Si el tipo de reporte para la entrada
                    // es con retraso.
                    if(reporteEntrada.reporte.idTipoReporteVinculado == 9) {
                        // entonces se marca un retraso.
                        reporte.retraso ++;
                    }

                    // Si el tipo de reporte para la salida
                    // es con extras.
                    if(reporteSalida.reporte.idTipoReporteVinculado == 11) {
                        // entonces se marca la salida con extras.
                        reporte.extras ++;
                    }

                    // Verificamos que existan los registros del descanso.
                    if(reporteInicioDescanso && reporteFinDescanso) {
                        // Calculamos el tiempo de descanso.
                        reporte.tiempoDescansoTotal += (
                            reporteFinDescanso.fechaRegistroReporteChequeo.getTime()
                            - reporteInicioDescanso.fechaRegistroReporteChequeo.getTime()
                        );
                    }
                }
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