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
const { rangoHoy, rangoSemana } = require("../utils/tiempo");
const { existeRegistro } = require("../utils/registros");

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
        if(!diasLaborales) {
            // Retorna una alerta de registro vinculado no existe.
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Consultamos los registros de chequeos pertenecientes al
        // empleado dado generados en el tiempo dado.
        const registros = await ReportesChequeos.findAll({
            where: {
                idEmpleadoVinculado: idEmpleadoVinculado,
                fechaRegistroReporteChequeo: {
                    [Op.between]: rangoSemana(),
                }
            },
            include: [{
                required: true,
                model: Reportes,
                where: {
                    idTipoReporteVinculado: {
                        [Op.or]: [8, 9, 10, 11]
                    }
                },
                include: [{
                    model: TiposReportes
                }]
            }],
            order: [['fechaRegistroReporteChequeo', 'DESC']],
        });

        // Lista de dias con llegadas tardes, faltas, etc.
        const datosPorDia = {};

        // Generamos un reporte por cada dia laboral.
        diasLaborales.forEach((diaLaboral) => {
            const descansa = diaLaboral.esDescanso;

            // Listamos los dias de descanso.
            if(descansa) {
                datosPorDia[diaLaboral.dia] = {
                    descanso: diaLaboral.esDescanso,
                };

            } else {
                datosPorDia[diaLaboral.dia] = {
                    falto: true,
                    descanso: diaLaboral.esDescanso,
                    llegoTarde: true,
                    salioTarde: false,
                    tiempoTrabajo: 0
                };
            }
        });

        // Tiempo total de trabajo en milisegundos.
        let tiempoTrabajoTotal = 0;

        // Nos movemos desde el ultimo elemento de la
        // lista, hasta el primero
        let index = registros.length - 1;
        while (index > 1) {
            // Recuperamos el elemento en n y n - 1;
            const registro = registros[index];
            const registroSiguiente = registros[index - 1];

            // Si los reportes estan echos por el mismo empleado y el
            // reporte en n es de tipo inicio de actividad, mientras
            // que el de n - 1 es de finalizacion de activdad.
            if(registro.fechaRegistroReporteChequeo.getDay() == registroSiguiente.fechaRegistroReporteChequeo.getDay()) {
                if(registro.reporte.idTipoReporteVinculado == 8 || registro.reporte.idTipoReporteVinculado == 9) {
                    if(registroSiguiente.reporte.idTipoReporteVinculado == 10 || registroSiguiente.reporte.idTipoReporteVinculado == 11) {
                        // Eso quiere decir que es un periodo de actividad,
                        // calculamos el tiempo de actividad por periodo, este
                        // tiempo esta en milisegundos.
                        const tiempoTrabajo = registroSiguiente.fechaRegistroReporteChequeo
                        - registro.fechaRegistroReporteChequeo;

                        // Se cambia la bandera de falto.
                        datosPorDia[
                            registro.fechaRegistroReporteChequeo.getDay()
                        ].tiempoTrabajo = tiempoTrabajo;

                        // Se cambia la bandera de falto.
                        datosPorDia[
                            registro.fechaRegistroReporteChequeo.getDay()
                        ].falto = false;

                        // Se cambia la bandera de descanso.
                        datosPorDia[
                            registro.fechaRegistroReporteChequeo.getDay()
                        ].descanso = false;

                        // Se cambia la bandera de llego tarde.
                        if(registro.reporte.idTipoReporteVinculado == 9) {
                            datosPorDia[
                                registro.fechaRegistroReporteChequeo.getDay()
                            ].llegoTarde = false;
                        }

                        // Se cambia la bandera de salio tarde.
                        if(registroSiguiente.reporte.idTipoReporteVinculado == 11) {
                            datosPorDia[
                                registro.fechaRegistroReporteChequeo.getDay()
                            ].salioTarde = true;
                        }

                        // Aumentamos el tiempo total en la semana
                        // de trabajo.
                        tiempoTrabajoTotal += tiempoTrabajo;

                        // Nos movemos al siguiente periodo.
                        index -= 2;

                    } else {
                        // Si no es asi, eso quiere decir eque el periodo esta
                        // mal formado, saltamos el reporte actual al siguiente.
                        index -= 1;
                    }

                } else {
                    // Si no es asi, eso quiere decir eque el periodo esta
                    // mal formado, saltamos el reporte actual al siguiente.
                    index -= 1;
                }

            } else {
                // Si no es asi, eso quiere decir eque el periodo esta
                // mal formado, saltamos el reporte actual al siguiente.
                index -= 1;
            }

        }

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            tiempoTrabajoTotal: tiempoTrabajoTotal,
            datosPorDia: datosPorDia
        });

    } catch(excepcion) {
        // Mostramos el error en la consola
        console.log(excepcion);

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
        const idDispositivoVinculado = cuerpo.idDispositivoVinculado;

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
        console.log(excepcion);

        // Retornamos un codigo de error.
        return respuesta.status(500).send({
            codigoRespuesta: CODIGOS.API_ERROR,
        });
    }
};