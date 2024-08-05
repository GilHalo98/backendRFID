// Modelos de la DB
const db = require("../models/index");

// Codigos de la API.
const respuestas = require("../utils/codigosAPI");

// Funciones del token
const { getTokenPayload } = require('../utils/jwtConfig')

// Instanciamos los codigos.
const CODIGOS = new respuestas.CodigoApp();

// Operadores de sequelize para consultas
const { Op } = require("sequelize");

// Funciones extra.
const {
    rangoDia,
    rangoHoy,
    rangoSemana,
    msToTime,
} = require("../utils/tiempo");

const {
    existeRegistro
} = require("../utils/registros");

const {
    mostrarLog
} = require("../utils/logs");
const reporte = require("../models/reporte");

// Modelos que usara el controlador.
const ReportesActividades = db.reporteActividad;
const ReportesChequeos = db.reporteChequeo;
const DispositivosIoT = db.dispositivoIoT;
const ReportesAccesos = db.reporteAcceso;
const TiposReportes = db.tipoReporte;
const DiasLaborales = db.diaLaboral;
const Empleados = db.empleado;
const Horarios = db.horario;
const Reportes = db.reporte;

// Genera un reporte de horas trabajadas en el periodo de tiempo dado.
exports.reporteDeHorasTrabajadas = async(request, respuesta) => {
    /*TODO: ARREGLA ESTE PEDO QLERO*/
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

        // Recuperamos los datos de la consulta.
        const idEmpleadoVinculado = cuerpo.idEmpleadoVinculado;

        // Verificamos que los datos para la busqueda esten completos.
        if(!idEmpleadoVinculado) {
            // Si no estan completos mandamos
            // un mensaje de datos incompletos.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_BUSQUEDA_INCOMPLETOS
            });
        }

        // Verificamos que los registros vinculados existan.
        if(! await existeRegistro(Empleados, idEmpleadoVinculado)) {
            // Retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Buscamos el horario del empleado.
        const horario = await Horarios.findOne({
            where: {
                idEmpleadoVinculado: idEmpleadoVinculado
            },
        });

        // Si no existe un horario para el empleado.
        if(!horario) {
            // Retorna una alerta de registro vinculado no existe.
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Buscamos los registros de los dias laborales vinculados al
        // horario.
        const diasLaborales = await DiasLaborales.findAll({
            where: {
                idHorarioVinculado: horario.id
            }
        });

        // Si no existen los dias laborales para el horario.
        if(diasLaborales.length < 7) {
            // Retorna una alerta de registro vinculado no existe.
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Tiempo total de trabajo en milisegundos.
        let tiempoTrabajoTotal = 0;

        // Lista de horas trabajadas por dia.
        const datosPorDia = {};

        for (let index = 0; index < diasLaborales.length; index++) {
            // Instancia del dia laboral.
            const diaLaboral = diasLaborales[index];
            
            // Consultamos los reportes de chequeos.
            const reporteEntrada = await ReportesChequeos.findOne({
                where: {
                    idEmpleadoVinculado: idEmpleadoVinculado,
                    fechaRegistroReporteChequeo: {
                        [Op.between]: rangoDia(diaLaboral.dia),
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

            const reporteInicioDescanso = await ReportesChequeos.findOne({
                where: {
                    idEmpleadoVinculado: idEmpleadoVinculado,
                    fechaRegistroReporteChequeo: {
                        [Op.between]: rangoDia(diaLaboral.dia),
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

            const reporteFinDescanso = await ReportesChequeos.findOne({
                where: {
                    idEmpleadoVinculado: idEmpleadoVinculado,
                    fechaRegistroReporteChequeo: {
                        [Op.between]: rangoDia(diaLaboral.dia),
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

            const reporteSalida = await ReportesChequeos.findOne({
                where: {
                    idEmpleadoVinculado: idEmpleadoVinculado,
                    fechaRegistroReporteChequeo: {
                        [Op.between]: rangoDia(diaLaboral.dia),
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

            // Para realizar el calculo de las horas
            // trabajadas y descansadas.
            let tiempoTrabajo = 0;
            let tiempoDescanso = 0;

            // Identificamos si falto.
            let falto = false;


            // Identificamos si llego tarde.
            let llegoTarde = false;

            // Identificamos si salio tarde.
            let salioTarde = false;

            // Si existen el reporte de entrada y salida.
            if(!(!reporteSalida || !reporteEntrada)) {
                // Calculamos el tiempo de trabajo en milisegundos.
                tiempoTrabajo = reporteSalida.fechaRegistroReporteChequeo
                    - reporteEntrada.fechaRegistroReporteChequeo;

                llegoTarde = reporteEntrada.idTipoReporteVinculado == 9 ?
                    true : false;

                salioTarde = reporteSalida.idTipoReporteVinculado == 11 ?
                    true : false;

            } else {
                // Marcamos que el empleado falto.
                falto = diaLaboral.esDescanso? true : false;
            }

            // Si existen el reporte de inicio y fin de descanso.
            if(!(!reporteInicioDescanso || !reporteFinDescanso)) {
                // Calculamos el tiempo de descanso en milisegundos.
                tiempoDescanso = reporteFinDescanso.fechaRegistroReporteChequeo
                    - reporteInicioDescanso.fechaRegistroReporteChequeo;
            }

            // Guardamos la informacion en el diccionario.
            datosPorDia[diaLaboral.dia] = {
                tiempoTrabajo: tiempoTrabajo - tiempoDescanso,
                tiempoDescanso: tiempoDescanso,
                llegoTarde: llegoTarde,
                salioTarde: salioTarde,
                esDescanso: diaLaboral.esDescanso,
                falto: falto
            };

            // Acumulamos el tiempo de trabajo total
            tiempoTrabajoTotal += tiempoTrabajo - tiempoDescanso;
        }

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            tiempoTrabajoTotal: tiempoTrabajoTotal,
            datosPorDia: datosPorDia
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

// Genera un historial de actividad de una maquinada dada.
exports.historialActividadMaquina = async(request, respuesta) => {
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

        // Recuperamos los datos de la consulta.
        const idDispositivoVinculado = consulta.idDispositivoVinculado;

        // Verificamos que los datos de la consulta esten completos.
        if(!idDispositivoVinculado) {
            // Si no estan completos mandamos
            // un mensaje de datos incompletos.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_BUSQUEDA_INCOMPLETOS
            });
        }

        // Verificamos los datos del registro.
        if(! await existeRegistro(DispositivosIoT, idDispositivoVinculado))  {
            // Retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Consultamos todos los registros de reportes.
        const registros = await ReportesActividades.findAll({
            where: {
                idDispositivoVinculado: idDispositivoVinculado,
                fechaRegistroReporteActividad: {
                    [Op.between]: rangoSemana(),
                }
            },
            include: [{
                model: Reportes,
                include: [{
                    model: TiposReportes
                }]
            }, {
                model: Empleados
            }],
            order: [['fechaRegistroReporteActividad', 'DESC']],
        })

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
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