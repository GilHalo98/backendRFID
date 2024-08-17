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
    deserealizarSemana,
    rangoSemana,
    rangoDia,
    rangoHoy,
    msToTime,
} = require("../utils/tiempo");

const {
    existeRegistro
} = require("../utils/registros");

const {
    mostrarLog
} = require("../utils/logs");

// Modelos de datos.
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
const Roles = db.rol;

// Genera un reporte de horas trabajadas en el periodo de tiempo dado.
exports.reporteHorasTrabajadas = async(request, respuesta) => {
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

        // Verificamos si se selecciono un offset.
        const offset = (
            !consulta.offset ? consulta.offset : parseInt(consulta.offset)
        );

        // Verificamos si se selecciono un maximo de elementos por pagina.
        const limit = (
            !consulta.limit ? consulta.limit : parseInt(consulta.limit)
        );

        // Construimos la consulta hacia la db.
        const datos = Object();

        // Agregamos los parametros de la consulta.
        if(consulta.id) {
           datos.id = consulta.id; 
        }

        if(consulta.nombres) {
            datos.nombres = {
                [Op.substring]: consulta.nombres
            };
        }

        if(consulta.idRolVinculado) {
            // Si no existe.
            if(! await existeRegistro(Roles, consulta.idRolVinculado)) {
                // Retornamos un mensaje de error.
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                });
            }

            // Si existe, se agrega el dato a la busqueda.
            datos.idRolVinculado = consulta.idRolVinculado;
        }

        // Inicializamos el rango de la semana a generar el reporte.
        const semanaReporte = consulta.semanaReporte?
            deserealizarSemana(consulta.semanaReporte) : null;

        // Consultamos el total de los registros.
        const totalRegistros = await Empleados.count({
            where: datos
        });

        // Consultamos todos los registros.
        const registros = await Empleados.findAll({
            offset: offset,
            limit: limit,
            where: datos,
            attributes: {
                exclude: [
                    'numeroTelefonico',
                    'edad',
                    'fechaNacimiento',
                    'fechaRegistroEmpleado',
                    'fechaModificacionEmpleado'
                ]
            },
            include: [{
                model: Horarios,
                attributes: {
                    exclude: [
                        'fechaRegistroHorario',
                        'fechaModificacionHorario'
                    ]
                },
                include: [{
                    model: DiasLaborales,
                    attributes: {
                        exclude: [
                            'fechaRegistroDia',
                            'fechaModificacionDia'
                        ]
                    },
                }]
            }]
        });

        // Lista de datos por empleado.
        const datosPorEmpleado = [];

        // Por cada registro en los registros.
        for(let i = 0; i < registros.length; i++) {
            // Registro de empleado.
            const registro = registros[i];

            // Tiempo total de trabajo en milisegundos.
            let tiempoTrabajoTotal = 0;

            // Lista de horas trabajadas por dia.
            const datosPorDia = [];

            // Registro de horario del empleado.
            const horario = registro.horario;

            // Si el registro del empelado no tiene horario.
            if(!horario) {
                // Guardamos los datos a enviar
                datosPorEmpleado.push({
                    id: registro.id,
                    nombres: registro.nombres,
                    apellidoPaterno: registro.apellidoPaterno,
                    apellidoMaterno: registro.apellidoMaterno,
                    idImagenVinculada: registro.idImagenVinculada,
                    idRolVinculado: registro.idRolVinculado,
                    tiempoTrabajoTotal: tiempoTrabajoTotal,
                    horasTrabajadas: null
                });

                // Se retorna un nulo.
                continue;
            }

            // Registros de dias laborales del horario.
            const diasLaborales = horario.diaLaborals;

            // Si el registro del empelado no tiene dias laborales.
            if(!diasLaborales) {
                // Guardamos los datos a enviar
                datosPorEmpleado.push({
                    id: registro.id,
                    nombres: registro.nombres,
                    apellidoPaterno: registro.apellidoPaterno,
                    apellidoMaterno: registro.apellidoMaterno,
                    idImagenVinculada: registro.idImagenVinculada,
                    idRolVinculado: registro.idRolVinculado,
                    tiempoTrabajoTotal: tiempoTrabajoTotal,
                    horasTrabajadas: null
                });

                // Se retorna un nulo.
                continue;
            }

            // Por cada dia laboral en el horario.
            for(let j = 0; j < diasLaborales.length; j++) {
                // Registro de dia laboral.
                const diaLaboral = diasLaborales[j];

                const rangoDiaReporte = rangoDia(
                    diaLaboral.dia - 1,
                    semanaReporte
                );

                // Consultamos los reportes de chequeos.
                const reporteEntrada = await ReportesChequeos.findOne({
                    where: {
                        idEmpleadoVinculado: registro.id,
                        fechaRegistroReporteChequeo: {
                            [Op.between]: rangoDiaReporte,
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
                        idEmpleadoVinculado: registro.id,
                        fechaRegistroReporteChequeo: {
                            [Op.between]: rangoDiaReporte,
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
                        idEmpleadoVinculado: registro.id,
                        fechaRegistroReporteChequeo: {
                            [Op.between]: rangoDiaReporte,
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
                        idEmpleadoVinculado: registro.id,
                        fechaRegistroReporteChequeo: {
                            [Op.between]: rangoDiaReporte,
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

                    llegoTarde = reporteEntrada.reporte.idTipoReporteVinculado == 9 ?
                        true : false;

                    salioTarde = reporteSalida.reporte.idTipoReporteVinculado == 11 ?
                        true : false;

                } else {
                    // Marcamos que el empleado falto.
                    falto = diaLaboral.esDescanso? false : true;
                }

                // Si existen el reporte de inicio y fin de descanso.
                if(!(!reporteInicioDescanso || !reporteFinDescanso)) {
                    // Calculamos el tiempo de descanso en milisegundos.
                    tiempoDescanso = reporteFinDescanso.fechaRegistroReporteChequeo
                        - reporteInicioDescanso.fechaRegistroReporteChequeo;
                }

                // Construimos los datos a detalle del reporte.
                const datosDetalle = {
                    entrada: !reporteEntrada?
                        null: reporteEntrada.fechaRegistroReporteChequeo,

                    inicioDescanso: !reporteInicioDescanso?
                        null: reporteInicioDescanso.fechaRegistroReporteChequeo,

                    finDescanso: !reporteFinDescanso?
                        null: reporteFinDescanso.fechaRegistroReporteChequeo,

                    salida: !reporteSalida?
                        null: reporteSalida.fechaRegistroReporteChequeo ,
                };

                // Guardamos la informacion en el diccionario.
                datosPorDia.push({
                    dia: diaLaboral.dia,
                    detalle: datosDetalle,
                    tiempoTrabajo: tiempoTrabajo - tiempoDescanso,
                    tiempoDescanso: tiempoDescanso,
                    llegoTarde: llegoTarde,
                    salioTarde: salioTarde,
                    esDescanso: diaLaboral.esDescanso,
                    falto: falto
                });

                // Acumulamos el tiempo de trabajo total
                tiempoTrabajoTotal += tiempoTrabajo - tiempoDescanso;
            }

            // Guardamos los datos a enviar
            datosPorEmpleado.push({
                id: registro.id,
                nombres: registro.nombres,
                apellidoPaterno: registro.apellidoPaterno,
                apellidoMaterno: registro.apellidoMaterno,
                idImagenVinculada: registro.idImagenVinculada,
                idRolVinculado: registro.idRolVinculado,
                tiempoTrabajoTotal: tiempoTrabajoTotal,
                horasTrabajadas: datosPorDia
            });
        }

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            totalRegistros: totalRegistros,
            datosPorEmpleado: datosPorEmpleado
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
exports.reporteActividadMaquina = async(request, respuesta) => {
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

        // Construimos la consulta hacia la db.
        const datos = Object();

        // Agregamos los parametros de la consulta.
        if(consulta.id) {
           datos.idDispositivoVinculado = consulta.id; 
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
            }
        }

        // Verificamos los datos del registro.
        if(! await existeRegistro(DispositivosIoT, consulta.id))  {
            // Retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Consultamos todos los registros de reportes de actividad del
        // dispositivo.
        const registros = await ReportesActividades.findAll({
            where: datos,
            include: [{
                model: Reportes,
                include: [{
                    model: TiposReportes
                }]
            }, {
                model: Empleados
            }],
            order: [['fechaRegistroReporteActividad', 'DESC']],
        });

        // Tiempo total de actividad en milisegundos.
        let tiempoActividadTotal = 0;

        // Tiempo total de inactividad en milisegundos.
        let tiempoInactivoTotal = 0;

        // Fecha de finalizacion del periodo anterior.
        let periodoAnterior = undefined;

        // Nos movemos desde el ultimo elemento de la
        // lista, hasta el primero
        let index = registros.length - 1;
        while (index >= 1) {
            // Recuperamos el elemento en n y n - 1;
            const registro = registros[index];
            const registroSiguiente = registros[index - 1];

            const idEmpleado = registro.idEmpleadoVinculado;
            const idEmpleadoSiguiente = registroSiguiente.idEmpleadoVinculado;

            // Si los reportes estan echos por el mismo empleado y el
            // reporte en n es de tipo inicio de actividad, mientras
            // que el de n - 1 es de finalizacion de activdad.
            if(idEmpleado == idEmpleadoSiguiente) {
                if(typeof periodoAnterior !== 'undefined') {
                    // Calculamos el tiempo de inactividad.
                    tiempoInactivoTotal += registro.fechaRegistroReporteActividad
                        - periodoAnterior.fechaRegistroReporteActividad;
                }

                // Eso quiere decir que es un periodo de actividad,
                // calculamos el tiempo de actividad por periodo, este
                // tiempo esta en milisegundos.
                tiempoActividadTotal += registroSiguiente.fechaRegistroReporteActividad
                    - registro.fechaRegistroReporteActividad;

                // Actualizamos el fin el periodo anterior.
                periodoAnterior = registroSiguiente;

                // Nos movemos al siguiente periodo.
                index -= 2;

            } else {
                // Si no es asi, eso quiere decir eque el periodo esta
                // mal formado, saltamos el reporte actual al siguiente.
                index -= 1;
            }

        }

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            tiempoActividadTotal: tiempoActividadTotal,
            tiempoInactivoTotal: tiempoInactivoTotal
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

// Genera un reporte de los reportes de usos de la maquina.
exports.reporteUsosMaquina = async(request, respuesta) => {
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

        // Verificamos si se selecciono un offset.
        const offset = (
            !consulta.offset ? consulta.offset : parseInt(consulta.offset)
        );

        // Verificamos si se selecciono un maximo de elementos por pagina.
        const limit = (
            !consulta.limit ? consulta.limit : parseInt(consulta.limit)
        );

        // Construimos la consulta hacia la db.
        const datos = Object();

        // Agregamos los parametros de la consulta.
        if(consulta.id) {
           datos.idDispositivoVinculado = consulta.id; 
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
        // Verificamos los datos del registro.
        if(! await existeRegistro(DispositivosIoT, consulta.id))  {
            // Retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Consultamos el total de los registros.
        const totalRegistros = await ReportesActividades.count({
            where: datos
        });

        // Consultamos todos los registros.
        const registros = await ReportesActividades.findAll({
            offset: offset,
            limit: limit,
            where: datos,
            include: [{
                model: Reportes
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

// Genera un repote de los operadores de la maquina.
exports.reporteOperadoresMaquina = async(request, respuesta) => {
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

        // Verificamos si se selecciono un offset.
        const offset = (
            !consulta.offset ? consulta.offset : parseInt(consulta.offset)
        );

        // Verificamos si se selecciono un maximo de elementos por pagina.
        const limit = (
            !consulta.limit ? consulta.limit : parseInt(consulta.limit)
        );

        // Construimos la consulta hacia la db.
        const datos = Object();

        // Agregamos los parametros de la consulta.
        if(consulta.id) {
           datos.idDispositivoVinculado = consulta.id; 
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
        // Verificamos los datos del registro.
        if(! await existeRegistro(DispositivosIoT, consulta.id))  {
            // Retornamos un mensaje de error.
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
                    idTipoReporteVinculado: 13
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
                    idTipoReporteVinculado: 13
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