// Modelos de la DB
const db = require("../models/index");

// Codigos de la API.
const respuestas = require("../utils/codigosAPI");

// Instanciamos los codigos.
const CODIGOS = new respuestas.CodigoApp();

// Operadores de sequelize para consultas
const { Op } = require("sequelize");

// Para la creacion y lectura de tokens.
const { getTokenPayload } = require("../utils/jwtConfig");
const { existeRegistro } = require("../utils/registros");
const {
    empleadoLlegoATiempo,
    empleadoSalioTarde,
    rangoHoy
} = require("../utils/tiempo");

// Modelos que usara el controlador.
const ReportesDispositivos = db.reporteDispositivo;
const DispositivosIoT = db.dispositivoIoT;
const ReportesChequeos = db.reporteChequeo;
const ReportesAccesos = db.reporteAcceso;
const ReportesActividades = db.reporteActividad
const TiposReportes = db.tipoReporte;
const DiasLaborales = db.diaLaboral;
const Horarios = db.horario;
const Empleados = db.empleado;
const Reportes = db.reporte;

// Registra un reporte.
exports.registrarReporteAcceso = async(request, respuesta) => {
    // POST Request.
    const cabecera = request.headers;
    const cuerpo = request.body;
    const parametros = request.params;

    try {
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

        // Recuperamos los datos del reporte.
        const resolucionAcceso = cuerpo.resolucionAcceso;
        const idEmpleadoVinculado = cuerpo.idEmpleadoVinculado;

        // Verificamos que los datos para el registro del reporte esten
        // completos, sino es asi, retornamos un mensaje de error.
        if(!resolucionAcceso || !idEmpleadoVinculado) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            });
        }

        // Esto se sacara del payload
        const idDispositivo = payload.idDispositivo;

        // Si no existen el registro del empleado entoces retorna un error.
        if(! await existeRegistro(Empleados, idEmpleadoVinculado)) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Verificamos que el dispositivo este registrado en la DB.
        const registroDispositivo = await DispositivosIoT.findByPk(
            idDispositivo
        );

        // Si no es asi, entonces retorna un mensaje de error.
        if(!registroDispositivo) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Se inicializan los datos del registro del reporte.
        let descripcionReporte = undefined;
        let idTipoReporteVinculado = undefined;
        let idReporteVinculado = undefined;

        // Verificamos la resolucion de la peticion de acceso al area.
        if(resolucionAcceso) {
            // Si se le dio acceso a la zona, se genera un reporte de acceso
            // concedido.

            descripcionReporte = "Acceso concedido al empleado a zona";
            idTipoReporteVinculado = 1;

        } else {
            // De lo contrario se registra el reporte de acceso negado.
            descripcionReporte = "Acceso negado al empleado a zona";
            idTipoReporteVinculado = 2;
        }

        // Verifiamos que existan los datos para registrar el reporte.
        if(!descripcionReporte || !idTipoReporteVinculado) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            });
        }

        // Registramos el reporte.
        await Reportes.create({
            descripcionReporte: descripcionReporte,
            fechaRegistroReporte: fecha,
            idTipoReporteVinculado: idTipoReporteVinculado
        }).then((registro) => {
            idReporteVinculado = registro.id;
        });

        // Ahora registramos el reporte de acceso.
        await ReportesAccesos.create({
            fechaRegistroReporteAcceso: fecha,
            idReporteVinculado: idReporteVinculado,
            idEmpleadoVinculado: idEmpleadoVinculado,
            idZonaVinculada: registroDispositivo.idZonaVinculada
        });

        // Retornamos un mensaje de ok.
        return respuesta.status(200).json({
            codigoRespuesta: CODIGOS.OK
        });

    } catch(excepcion) {
        // Mostramos la excepción en la consola.
        console.log(excepcion);

        // Retornamso el codigo del error de la api.
        return respuesta.status(500).send({
            codigoRespuesta: CODIGOS.API_ERROR
        });
    }
};

// Registra un reporte.
exports.registrarReporteErrorAutentificacion = async(request, respuesta) => {
    // POST Request.
    const cabecera = request.headers;
    const cuerpo = request.body;
    const parametros = request.params;

    try {
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

        // Recuperamos los datos del reporte.
        const descripcionReporte = "Error al autentificar tarjeta";
        const idTipoReporteVinculado = 3;

        /*Esto se sacara del payload*/
        const idDispositivo = payload.idDispositivo;

        // Verificamos que el registro del dispositivo exista.
        const dispositivo = await DispositivosIoT.findByPk(idDispositivo);

        // Si el registro no existe, retornamos un error.
        if(!dispositivo) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Instanciamos los datos del reporte de error de autentificacion.
        let idReporteVinculado = undefined;

        // Registramos el reporte.
        await Reportes.create({
            descripcionReporte: descripcionReporte,
            fechaRegistroReporte: fecha,
            idTipoReporteVinculado: idTipoReporteVinculado

        }).then((registro) => {
            idReporteVinculado = registro.id;
        });

        // Registramos el reporte de error de autentificacion.
        await ReportesDispositivos.create({
            fechaRegistroReporteDispositivo: fecha,
            idReporteVinculado: idReporteVinculado,
            idDispositivoVinculado: idDispositivo
        });

        // Retornamos un mensaje de ok.
        return respuesta.status(200).json({
            codigoRespuesta: CODIGOS.OK
        });

    } catch(excepcion) {
        // Mostramos la excepción en la consola.
        console.log(excepcion);

        // Retornamso el codigo del error de la api.
        return respuesta.status(500).send({
            codigoRespuesta: CODIGOS.API_ERROR
        });
    }
};

// Valida la existencia del registro de un empleado.
exports.validarRegistroEmpleado = async(request, respuesta) => {
    // GET Request.
    const cabecera = request.headers;
    const cuerpo = request.body;
    const parametros = request.params;

    try {
        // Desencriptamos el payload del token.
        const payload = await getTokenPayload(cabecera.authorization);

        // Verificamos que el paload sea valido.
        if(!payload) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.TOKEN_INVALIDO
            });
        }

        // Recuperamos los datos del cuerpo.
        const idEmpelado = cuerpo.idEmpleadoVinculado;

        // Verificamos que existan los datos para realizar la busqueda.
        if(!idEmpleado) {
            return respuesta.status(200).json({
                codigosRespuesta: CODIGOS.DATOS_BUSQUEDA_INCOMPLETOS
            });
        }

        // Verificamos la existencia del registro.
        if(await existeRegistro(Empleados, idEmpleado)) {
            // Si existe el registro, retornamos un mensaje de OK.
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.OK
            })
        }

        // Si el registro no existe, retornamos un mensaje de
        // empleado no encontrado.
        return respuesta.status(200).json({
            codigoRespuetsa: CODIGOS.EMPELADO_NO_ENCONTRADO
        });

    } catch(excepcion) {
        // Mostramos la excepcion en la consola.
        console.log(excepcion);

        // Retornamos el codigo de error con la api.
        return respuesta.status(500).json({
            codigoRespuesta: CODIGOS.API_ERROR
        });
    }
};

// Registra un reporte.
exports.registrarReporteEmpleadoInexistente = async(request, respuesta) => {
    // POST Request.
    const cabecera = request.headers;
    const cuerpo = request.body;
    const parametros = request.params;

    try {
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

        // Recuperamos los datos del reporte.
        const descripcionReporte = "Empleado inexistente detectado";
        const idTipoReporteVinculado = 5;

        /*Esto se sacara del payload*/
        const idDispositivo = payload.idDispositivo;

        // Instanciamos los datos del reporte del dispositivo.
        let idReporteVinculado = undefined;

        // Guardamos el registro en la DB.
        await Reportes.create({
            descripcionReporte: descripcionReporte,
            fechaRegistroReporte: fecha,
            idTipoReporteVinculado: idTipoReporteVinculado

        }).then((registro) => {
            idReporteVinculado = registro.id;
        });

        // Guardamos el reporte del dispositivo.
        await ReportesDispositivo.create({
            idRepoteVinculado: idReporteVinculado,
            idDispositivoVinculado: idDispositivo
        })

        // Retornamos un mensaje de ok.
        return respuesta.status(200).json({
            codigoRespuesta: CODIGOS.OK
        });

    } catch(excepcion) {
        // Mostramos la excepción en la consola.
        console.log(excepcion);

        // Retornamso el codigo del error de la api.
        return respuesta.status(500).send({
            codigoRespuesta: CODIGOS.API_ERROR
        });
    }
};

// Registra un reporte de chequeo del empleado.
exports.registrarReporteChequeo = async (request, respuesta) => {
    // POST Request.
    const cabecera = request.headers;
    const cuerpo = request.body;
    const parametros = request.params;

    try {
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
        const dia = fecha.getDay();

        // Recuperamos los datos del reporte.
        const idEmpleadoVinculado = cuerpo.idEmpleadoVinculado;

        // Verificamos que existan los datos para generar el registro.
        if(!idEmpleadoVinculado) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            })
        }

        // Verificamos que exista el registro del empleado.
        if(! await existeRegistro(Empleados, idEmpleadoVinculado)) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Buscamos que el empleado tenga un horario.
        const horario = await Horarios.findOne({
            where: {
                idEmpleadoVinculado: idEmpleadoVinculado
            }
        });

        // Verificamos que exista el registor del horario del empleado.
        if(!horario) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Buscamos el dia de la semana actual en el horario.
        const diaLaboral = await DiasLaborales.findOne({
            where: {
                dia: dia,
                idHorarioVinculado: horario.id
            }
        })

        // Verificamos que exista el registor del dia laboral.
        if(!diaLaboral) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Buscamos por un registro de entrada en la DB.
        const reporteEntrada = await Reportes.findOne({
            where: {
                idTipoReporteVinculado: {
                    [Op.or]: [8, 9]
                },
                fechaRegistroReporte: {
                    [Op.between]: rangoHoy(),
                }
            },
            include: [{
                model: ReportesChequeos,
                where: {
                    idEmpleadoVinculado: idEmpleadoVinculado
                }

            }]
        });

        // Instanciamos los datos a guardar en el registro y el registro
        // de chequeo vinculado.
        let descripcionReporte = undefined;
        let idReporteVinculado = undefined;
        let idTipoReporteVinculado = undefined;

        if(!reporteEntrada) {
            // Se registra el reporte de entrada.

            // Verificamos si el chequeo de entrada del empleado fue con
            // retraso.
            if(empleadoLlegoATiempo(
                diaLaboral.horaEntrada,
                horario.tolerancia,
                fecha
            )) {
                descripcionReporte = "Chequeo de llegada de empleado";
                idTipoReporteVinculado = 8;

            } else {
                descripcionReporte = "Chequeo de llegada tarde de empleado";
                idTipoReporteVinculado = 9;
            }

        } else {
            // Buscamos por un registro de salida en la DB.
            const reporteSalida = await Reportes.findOne({
                where: {
                    idTipoReporteVinculado: {
                        [Op.or]: [10, 11]
                    },
                    fechaRegistroReporte: {
                        [Op.between]: rangoHoy(),
                    }
                },
                include: [{
                    model: ReportesChequeos,
                    where: {
                        idEmpleadoVinculado: idEmpleadoVinculado
                    }

                }]
            });

            // Si se encuentra el reporte de salida, envia un mensaje de
            // error.
            if(reporteSalida) {
                return respuesta.status(200).json({
                    codigoRespuesta: CODIGOS.OPERACION_INVALIDA
                });
            }

            // Se registra el reporte de salida.
            if(empleadoSalioTarde(
                diaLaboral.horaSalida,
                horario.tolerancia,
                fecha
            )) {
                descripcionReporte = "Chequeo de salida tarde de empleado";
                idTipoReporteVinculado = 11;

            } else {
                descripcionReporte = "Chequeo de salida de empleado";
                idTipoReporteVinculado = 10;
            }
        }

        // Verificamos que los datos del reporte esten completos.
        if(!descripcionReporte || !idTipoReporteVinculado) {
            // Si no estan completos mandamos
            // un mensaje de datos incompletos.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            });
        }

        // Registramos el reporte.
        await Reportes.create({
            descripcionReporte: descripcionReporte,
            fechaRegistroReporte: fecha,
            idTipoReporteVinculado: idTipoReporteVinculado

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
        console.log(excepcion);

        // Retornamso el codigo del error de la api.
        return respuesta.status(500).send({
            codigoRespuesta: CODIGOS.API_ERROR
        });
    }
};

// Registra un reporte de credenciales invalidas
// para iniciar la actividad.
exports.registrarReporteCredencialesInvalidasParaActividad = async(
    request,
    respuesta
) => {
    // POST Request.
    const cabecera = request.headers;
    const cuerpo = request.body;
    const parametros = request.params;

    try {
        // Desencriptamos el payload del token.
        const payload = await getTokenPayload(cabecera.authorization);

        // Verificamos que el paload sea valido.
        if(!payload) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.TOKEN_INVALIDO
            });
        }

        // Instanciamos la fecha del registro.
        const fecha = new Date();

        // Recuperamos los datos del registro.
        const descripcionReporte = "Credenciales para inicio de actividad invalidos";
        const idEmpleadoVinculado = cuerpo.idEmpleadoVinculado;
        const idTipoReporteVinculado = 14;

        /*Esto se sacara del payload*/
        const idDispositivo = payload.idDispositivo;

        // Verificamos que existan los datos para generar el registro.
        if(!idEmpleadoVinculado) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            })
        }

        // Verificamos que exista el registro del empleado.
        if(! await existeRegistro(Empleados, idEmpleadoVinculado)) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Verificamos que el registro del dispositivo exista.
        const dispositivo = await DispositivosIoT.findByPk(idDispositivo);

        // Si el registro no existe, retornamos un error.
        if(!dispositivo) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Instanciamos los datos del reporte de la actividad.
        let idReporteVinculado = undefined;

        // Registramos el reporte.
        await Reportes.create({
            descripcionReporte: descripcionReporte,
            fechaRegistroReporte: fecha,
            idTipoReporteVinculado: idTipoReporteVinculado

        }).then((registro) => {
            idReporteVinculado = registro.id;
        });

        // Registramos el reporte de la actividad.
        await ReportesActividades.create({
            fechaRegistroReporteActividad: fecha,
            idReporteVinculado: idReporteVinculado,
            idEmpleadoVinculado: idEmpleadoVinculado,
            idDispositivoVinculado: idDispositivo
        });

        // Retornamos un mensaje de ok.
        return respuesta.status(200).json({
            codigoRespuesta: CODIGOS.OK
        });

    } catch(excepcion) {
        // Mostramos la excepción en la consola.
        console.log(excepcion);

        // Retornamso el codigo del error de la api.
        return respuesta.status(500).send({
            codigoRespuesta: CODIGOS.API_ERROR
        });
    }
};

// Registra un reporte de actividad iniciada.
exports.registrarReporteInicioActividad = async(
    request,
    respuesta
) => {
    // POST Request.
    const cabecera = request.headers;
    const cuerpo = request.body;
    const parametros = request.params;

    try {
        // Desencriptamos el payload del token.
        const payload = await getTokenPayload(cabecera.authorization);

        // Verificamos que el paload sea valido.
        if(!payload) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.TOKEN_INVALIDO
            });
        }

        // Instanciamos la fecha del registro.
        const fecha = new Date();

        // Recuperamos los datos del registro.
        const descripcionReporte = "Actividad iniciada";
        const idEmpleadoVinculado = cuerpo.idEmpleadoVinculado;
        const idTipoReporteVinculado = 12;

        /*Esto se sacara del payload*/
        const idDispositivo = payload.idDispositivo;

        // Verificamos que existan los datos para generar el registro.
        if(!idEmpleadoVinculado) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            })
        }

        // Verificamos que exista el registro del empleado.
        if(! await existeRegistro(Empleados, idEmpleadoVinculado)) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Verificamos que el registro del dispositivo exista.
        const dispositivo = await DispositivosIoT.findByPk(idDispositivo);

        // Si el registro no existe, retornamos un error.
        if(!dispositivo) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Instanciamos los datos del reporte de la actividad.
        let idReporteVinculado = undefined;

        // Registramos el reporte.
        await Reportes.create({
            descripcionReporte: descripcionReporte,
            fechaRegistroReporte: fecha,
            idTipoReporteVinculado: idTipoReporteVinculado

        }).then((registro) => {
            idReporteVinculado = registro.id;
        });

        // Registramos el reporte de la actividad.
        await ReportesActividades.create({
            fechaRegistroReporteActividad: fecha,
            idReporteVinculado: idReporteVinculado,
            idEmpleadoVinculado: idEmpleadoVinculado,
            idDispositivoVinculado: idDispositivo
        });

        // Retornamos un mensaje de ok.
        return respuesta.status(200).json({
            codigoRespuesta: CODIGOS.OK
        });

    } catch(excepcion) {
        // Mostramos la excepción en la consola.
        console.log(excepcion);

        // Retornamso el codigo del error de la api.
        return respuesta.status(500).send({
            codigoRespuesta: CODIGOS.API_ERROR
        });
    }
};

// Registra un reporte de actividad finalizada.
exports.registrarReporteFinaliacionActividad = async(
    request,
    respuesta
) => {
    // POST Request.
    const cabecera = request.headers;
    const cuerpo = request.body;
    const parametros = request.params;

    try {
        // Desencriptamos el payload del token.
        const payload = await getTokenPayload(cabecera.authorization);

        // Verificamos que el paload sea valido.
        if(!payload) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.TOKEN_INVALIDO
            });
        }

        // Instanciamos la fecha del registro.
        const fecha = new Date();

        // Recuperamos los datos del registro.
        const descripcionReporte = "Actividad finalizada";
        const idEmpleadoVinculado = cuerpo.idEmpleadoVinculado;
        const idTipoReporteVinculado = 13;

        /*Esto se sacara del payload*/
        const idDispositivo = payload.idDispositivo;

        // Verificamos que existan los datos para generar el registro.
        if(!idEmpleadoVinculado) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            })
        }

        // Verificamos que exista el registro del empleado.
        if(! await existeRegistro(Empleados, idEmpleadoVinculado)) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Verificamos que el registro del dispositivo exista.
        const dispositivo = await DispositivosIoT.findByPk(idDispositivo);

        // Si el registro no existe, retornamos un error.
        if(!dispositivo) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Instanciamos los datos del reporte de la actividad.
        let idReporteVinculado = undefined;

        // Registramos el reporte.
        await Reportes.create({
            descripcionReporte: descripcionReporte,
            fechaRegistroReporte: fecha,
            idTipoReporteVinculado: idTipoReporteVinculado

        }).then((registro) => {
            idReporteVinculado = registro.id;
        });

        // Registramos el reporte de la actividad.
        await ReportesActividades.create({
            fechaRegistroReporteActividad: fecha,
            idReporteVinculado: idReporteVinculado,
            idEmpleadoVinculado: idEmpleadoVinculado,
            idDispositivoVinculado: idDispositivo
        });

        // Retornamos un mensaje de ok.
        return respuesta.status(200).json({
            codigoRespuesta: CODIGOS.OK
        });

    } catch(excepcion) {
        // Mostramos la excepción en la consola.
        console.log(excepcion);

        // Retornamso el codigo del error de la api.
        return respuesta.status(500).send({
            codigoRespuesta: CODIGOS.API_ERROR
        });
    }
};
