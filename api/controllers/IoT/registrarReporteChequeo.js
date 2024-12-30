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

// Para verificar la existencia de un registro en la db.
const {
    existeRegistro
} = require("../../utils/registros");

// Procesamiento de tiempo y fechas.
const {
    rangoHoy,
    ajustarTimeZone,
    empleadoSalioTarde,
    empleadoLlegoATiempo,
} = require("../../utils/tiempo");

// Funciones extra.
const {
    toDateTime,
    toSQLDate
} = require("../../utils/utils");

const {
    mostrarLog
} = require("../../utils/logs");

// Modelos que usara el controlador.
const Horarios = db.horario;
const Reportes = db.reporte;
const Empleados = db.empleado;
const DiasLaborales = db.diaLaboral;
const TiposReportes = db.tipoReporte;
const ReportesChequeos = db.reporteChequeo;

// Generamos el reporte de chequeo del empleado.
function generarReporteChequeo(
    registroEmpleado,
    registroHorario,
    registroDiaLaboral,
    registroReporteEntrada,
    registroReporteSalida,
    tipoReporteEntrada,
    tipoReporteEntradaRetraso,
    tipoReporteSalida,
    tipoReporteSalidaExtras,
    extras,
    fecha
) {
    /**
     * Registramos un reporte de chequo, ya sea entrada o salida, en
     * la base de datos dado el ultimo reporte de entrada y de salida.
    */

    // Instanciamos los datos a guardar en el registro y el registro
    // de chequeo vinculado.
    let descripcionReporte = undefined;
    let idTipoReporteVinculado = undefined;

    // Primera excepcion es si el dia es descanso y checo.
    if(registroDiaLaboral.esDescanso) {
        // En este caso como no hay una hora de entrada y salida,
        // el tiempo laboral no se marca con retraso o extras.
        // Si no existe el reporte de entrada.
        if(!registroReporteEntrada) {
            // Verificamos si el chequeo de entrada del empleado fue con
            // retraso.
            descripcionReporte = `Chequeo de llegada de ${
                registroEmpleado.nombres
            } ${
                registroEmpleado.apellidoPaterno
            } ${
                registroEmpleado.apellidoMaterno
            } con descanso laborado`;

            idTipoReporteVinculado = tipoReporteEntrada.id;

        // Si existe un registro de reporte de entrada.
        } else {
            // Si no existe un reporte de salida de empleado
            // registramos uno en la base de datos.
            if(!registroReporteSalida) {
                descripcionReporte = `Chequeo de salida de ${
                    registroEmpleado.nombres
                } ${
                    registroEmpleado.apellidoPaterno
                } ${
                    registroEmpleado.apellidoMaterno
                } con descanso laborado`;

                idTipoReporteVinculado = tipoReporteSalida.id;

            // Si ya se encuentran todos los reportes
            // registrados por el dia, retornamos nulo.
            } else {
                return null;
            }
        }

    // En caso de que el dia laboral no sea descanso.
    } else {
        // Si no existe el reporte de entrada.
        if(!registroReporteEntrada) {
            // Verificamos si el chequeo de entrada del empleado fue con
            // retraso.
            if(empleadoLlegoATiempo(
                registroDiaLaboral.horaEntrada,
                registroHorario.tolerancia,
                fecha
            )) {
                descripcionReporte = `Chequeo de llegada de ${
                    registroEmpleado.nombres
                } ${
                    registroEmpleado.apellidoPaterno
                } ${
                    registroEmpleado.apellidoMaterno
                }`;

                idTipoReporteVinculado = tipoReporteEntrada.id;

            } else {
                descripcionReporte = `Chequeo de llegada con retraso de ${
                    registroEmpleado.nombres
                } ${
                    registroEmpleado.apellidoPaterno
                } ${
                    registroEmpleado.apellidoMaterno
                }`;

                idTipoReporteVinculado = tipoReporteEntradaRetraso.id;
            }

        // Si existe un registro de reporte de entrada.
        } else {
            // Si no existe un reporte de salida de empleado
            // registramos uno en la base de datos.
            if(!registroReporteSalida) {
                if(empleadoSalioTarde(
                    registroDiaLaboral.horaSalida,
                    registroHorario.tolerancia,
                    fecha
                )) {
                    descripcionReporte = `Chequeo de salida tarde de ${
                        registroEmpleado.nombres
                    } ${
                        registroEmpleado.apellidoPaterno
                    } ${
                        registroEmpleado.apellidoMaterno
                    }`;

                    idTipoReporteVinculado = tipoReporteSalidaExtras.id;

                } else {
                    if(extras) {
                        descripcionReporte = `Chequeo de salida de ${
                            registroEmpleado.nombres
                        } ${
                            registroEmpleado.apellidoPaterno
                        } ${
                            registroEmpleado.apellidoMaterno
                        } con horas extras`;

                        idTipoReporteVinculado = tipoReporteSalidaExtras.id;

                    } else {
                        descripcionReporte = `Chequeo de salida de ${
                            registroEmpleado.nombres
                        } ${
                            registroEmpleado.apellidoPaterno
                        } ${
                            registroEmpleado.apellidoMaterno
                        }`;

                        idTipoReporteVinculado = tipoReporteSalida.id;
                    }
                }

            // Si ya se encuentran todos los reportes
            // registrados por el dia, retornamos un mensaje
            // de operacion invalida.
            } else {
                return null;
            }
        }
    }

    // Retornamos los datos.
    return {
        descripcionReporte: descripcionReporte,
        idTipoReporteVinculado: idTipoReporteVinculado
    };
};

// Registra un reporte de chequeo del empleado.
module.exports = async function registrarReporteChequeo (
    request,
    respuesta
) {
    // POST Request.
    const cabecera = request.headers;
    const cuerpo = request.body;
    const parametros = request.params;
    const consulta = request.query;

    try {
        /**
         * Desempaquetamos los datos del request.
        */

        // Desencriptamos el payload del token.
        const payload = await getTokenPayload(cabecera.authorization);

        // Verificamos que el payload sea valido.
        if(!payload) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.TOKEN_INVALIDO
            });
        }

        // Instanciamos la fecha del registro.
        const fecha = new Date();

        // Dia de la semana actual.
        const dia = fecha.getDay() == 0 ? 7 : fecha.getDay();

        // Recuperamos los datos del reporte.
        const idEmpleadoVinculado = cuerpo.idEmpleadoVinculado;

        // Verificamos que existan los datos para generar el registro.
        if(!cuerpo.idEmpleadoVinculado) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            })
        }

        /**
         * Consultamos Los registros vinculados. 
        */

        // Buscamos el registro del empleado.
        const registroEmpleado = await Empleados.findByPk(idEmpleadoVinculado);

        // Si alguno de los registros no existe.
        if(!registroEmpleado) {
            // Retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.EMPLEADO_NO_ENCONTRADO
            });
        }

        // Buscamos que el empleado tenga un horairo.
        const registroHorario = await Horarios.findOne({
            where: {
                idEmpleadoVinculado: registroEmpleado.id
            }
        });

        // Si alguno de los registros no existe.
        if(!registroHorario) {
            // Retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.HORARIO_NO_ENCONTRADO
            });
        }

        // Buscamos el dia de la semana actual en el horario.
        const registroDiaLaboral = await DiasLaborales.findOne({
            where: {
                dia: dia,
                idHorarioVinculado: registroHorario.id
            }
        });

        // Si alguno de los registros no existe.
        if(!registroDiaLaboral) {
            // Retornamos un mensaje de error.
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

        /**
         * Consultamos todos los reportes de 
         * del empleado del dia.
        */

        // !!!LAS HORAS EXTRA PASADAS DE LAS 12:59 SE TOMAN EN CUENTA
        // JUSTO ANTES DE LA HORA DE ENTRADA, AQUÍ ES IMPORTANTE AGREGAR
        // ALGUN MARGEN PARA QUE NO DETECTE MUY JUSTAMENTE COMO SI FUERAN
        // HORAS EXTRA, ESTO PUEDE SER UNA HORA O MAS ANTES DE LA HORA
        // DE ENTRADA¡¡¡
        const horaEntradaAjustada = ajustarTimeZone(toDateTime(
            registroDiaLaboral.horaEntrada
        ));

        horaEntradaAjustada.setHours(
            horaEntradaAjustada.getHours() - 2
        );

        // Detectamos si hubo horas extras pasadas de las 12:59 p.m.
        const extras = ajustarTimeZone(
            fecha
        ) < horaEntradaAjustada;

        // Ajustamos por las horas extras.
        const offsetDias = extras ? -1 : 0;

        // Consultamos el ultimo reporte de entrada del empleado.
        const registroReporteEntrada = await Reportes.findOne({
            where: {
                idTipoReporteVinculado: {
                    [Op.or]: [
                        tipoReporteEntrada.id,
                        tipoReporteEntradaRetraso.id
                    ]
                },
                fechaRegistroReporte: {
                    [Op.between]: rangoHoy(offsetDias),
                }
            },
            order: [
                ["fechaRegistroReporte", "DESC"]
            ],
            include: [{
                model: ReportesChequeos,
                where: {
                    idEmpleadoVinculado: idEmpleadoVinculado
                }
            }]
        });

        // Consultamos el ultimo reporte de salida del empleado.
        const registroReporteSalida = await Reportes.findOne({
            where: {
                idTipoReporteVinculado: {
                    [Op.or]: [
                        tipoReporteSalida.id,
                        tipoReporteSalidaExtras.id,
                    ]
                },
                fechaRegistroReporte: {
                    [Op.between]: rangoHoy(),
                }
            },
            order: [
                ["fechaRegistroReporte", "DESC"]
            ],
            include: [{
                model: ReportesChequeos,
                where: {
                    idEmpleadoVinculado: idEmpleadoVinculado
                }

            }]
        });

        // Procesamos los datos para generar el reporte de chequeo.
        const datosReporte = generarReporteChequeo(
            registroEmpleado,
            registroHorario,
            registroDiaLaboral,
            registroReporteEntrada,
            registroReporteSalida,
            tipoReporteEntrada,
            tipoReporteEntradaRetraso,
            tipoReporteSalida,
            tipoReporteSalidaExtras,
            extras,
            fecha
        );

        // Si los datos no fueron generados, entonces ocurrio un error.
        if(!datosReporte) {
            mostrarLog(
                'Empleado '
                + idEmpleadoVinculado.toString()
                + ' checo despues de la salida'
            );

            // Retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.OPERACION_INVALIDA
            });
        };

        // Instanciamos los datos a guardar en el registro y el registro
        // de chequeo vinculado.
        let idReporteVinculado = undefined;

        // Registramos el reporte.
        await Reportes.create({
            descripcionReporte: datosReporte.descripcionReporte,
            fechaRegistroReporte: fecha,
            idTipoReporteVinculado: datosReporte.idTipoReporteVinculado

        }).then((registro) => {
            idReporteVinculado = registro.id;
        });

        // Registramos el reporte de chequeo.
        await ReportesChequeos.create({
            fechaRegistroReporteChequeo: fecha,
            idReporteVinculado: idReporteVinculado,
            idEmpleadoVinculado: idEmpleadoVinculado
        });

        // Retornamos un mensaje de ok.
        return respuesta.status(200).json({
            codigoRespuesta: CODIGOS.OK
        });

    } catch(excepcion) {
        // Mostramos la excepción en la consola.
        mostrarLog(`Error con controlador: ${excepcion}`);

        // Retornamso el codigo del error de la api.
        return respuesta.status(500).send({
            codigoRespuesta: CODIGOS.API_ERROR
        });
    }
};