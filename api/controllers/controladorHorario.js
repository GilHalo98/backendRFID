// Modelos de la DB
const db = require("../models/index");

// Codigos de la API.
const respuestas = require("../utils/codigosAPI");

// Instanciamos los codigos.
const CODIGOS = new respuestas.CodigoApp();

// Operadores de sequelize para consultas
const { Op } = require("sequelize");

// Funcion para verificar que el registro exista en la DB.
const { existeRegistro } = require("../utils/registros");

// Para la creacion y lectura de tokens.
const { getTokenPayload } = require("../utils/jwtConfig");

// Incluimos la funcion de formateo de fechas.
const { toSQLDate, toSQLTime, toDateTime } = require("../utils/utils");

// Modelos que usara el controlador.
const DiasLaborales = db.diaLaboral;
const Empleados = db.empleado;
const Horarios = db.horario;

// Funciones extra.
const { mostrarLog } = require("../utils/logs");

// Consulta los registros en la base de datos.
exports.consultaHorario = async(request, respuesta) => {
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

        if(consulta.idEmpleadoVinculado) {
            // Si no existe.
            if(! await existeRegistro(Empleados, consulta.idEmpleadoVinculado)) {
                // Retornamos un mensaje de error.
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                });
            }

            // Si existe, se agrega el dato a la busqueda.
            datos.idEmpleadoVinculado = consulta.idEmpleadoVinculado;
        }

        // Consultamos el total de los registros.
        const totalRegistros = await Horarios.count({
            where: datos,
        });

        // Consultamos todos los registros.
        const registros = await Horarios.findAll({
            offset: offset,
            limit: limit,
            where: datos
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

// Guarda un registro en la base de datos.
exports.registrarHorario = async(request, respuesta) => {
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

        // Recuperamos la informacion del registro.
        const descripcionHorario = cuerpo.descripcionHorario;
        const tolerancia = cuerpo.tolerancia;
        const idEmpleadoVinculado = cuerpo.idEmpleadoVinculado;

        // Validamos que exista la informacion necesaria para
        // realizar el registro del permiso.
        if(
            !descripcionHorario
            || !tolerancia
            || !idEmpleadoVinculado
        ) {
            // Si no estan completos mandamos
            // un mensaje de datos incompletos.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            });
        }

        // Buscamos por registros con el id del registro vinculado.
        const coincidencia = await Horarios.findOne({
            where: {
                idEmpleadoVinculado: idEmpleadoVinculado
            }
        });

        // Si existe un registro con los mismos datos terminamos
        // la operacion.
        if(coincidencia) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_YA_EXISTE
            });
        }

        // Creamos el registro.
        const nuevoRegistro = {
            descripcionHorario: descripcionHorario,
            tolerancia: toSQLTime(tolerancia),
            idEmpleadoVinculado: idEmpleadoVinculado,
            fechaRegistroHorario: fecha
        };

        // Guardamos el registro en la DB.
        await Horarios.create(nuevoRegistro);

        // Retornamos una respuesta de exito.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK
        });

    } catch(excepcion) {
        // Mostramos el error en la consola
        mostrarLog(`Error con controlador: ${excepcion}`);

        // Retornamos un codigo de error.
        return respuesta.status(500).send({
            codigoRespuesta: CODIGOS.API_ERROR
        });
    }
};

// Modifica un registro de la base de datos.
exports.modificarHorario = async(request, respuesta) => {
    // PUT Request.
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

        // Instanciamos la fecha de la modificacion del registro.
        const fecha = new Date();

        // Recuperamos la informacion del registro.
        const id = consulta.id;

        const descripcionHorario = cuerpo.descripcionHorario;
        const tolerancia = cuerpo.tolerancia;
        const idEmpleadoVinculado = cuerpo.idEmpleadoVinculado;

        // Verificamos que exista un id del registro a modificar.
        if(!id) {
            // Si no, retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_BUSQUEDA_INCOMPLETOS
            });
        }

        // Buscamos el registro.
        const registro = await Horarios.findByPk(id);

        // Verificamos que exista el registro.
        if(!registro) {
            // Si no se encontro el registro, se envia un
            // codio de registro inexistente.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.HORARIO_NO_ENCONTRADO,
            });
        }

        // Cambiamos los datos del registro.
        if(descripcionHorario) {
            registro.descripcionHorario = descripcionHorario;
        }
        if(tolerancia) {
            registro.tolerancia = toSQLTime(tolerancia);
        }

        if(idEmpleadoVinculado) {
            // Si no existe.
            if(! await existeRegistro(Empleados, idEmpleadoVinculado)) {
                // Retornamos un mensaje de error.
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                });
            }

            registro.idEmpleadoVinculado = idEmpleadoVinculado;
        }

        // Actualizamos la fehca de modificacion del registro.
        registro.fechaModificacionHorario = fecha;

        // Guardamos los cambios.
        await registro.save();

        // Retornamos un mensaje de operacion ok.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK
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

// Elimina un registro de la base de datos dado un id.
exports.eliminarHorario = async(request, respuesta) => {
    // DELETE Request.
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

        // Instanciamos la fecha de la modificacion del registro.
        const fecha = new Date();

        // Recuperamos los parametros del request.
        const id = consulta.id;

        // Verificamos que los datos para la operacion esten completos.
        if(!id) {
            // Si no, retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_BUSQUEDA_INCOMPLETOS
            });
        }

        // Busca el registro dado el id.
        const registro = await Horarios.findByPk(id);

        // Si no existe el registro con el id.
        if(!registro) {
            // Retorna un error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.HORARIO_NO_ENCONTRADO,
            });
        }

        // Eliminamos el registro.
        await registro.destroy();

        // Retornamos la respuesta de operacion ok
        // y el registro eliminado.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            registroEliminado: registro
        })

    } catch(excepcion) {
        // Mostramos el error en la consola
        mostrarLog(`Error con controlador: ${excepcion}`);

        // Retornamos un codigo de error.
        return respuesta.status(500).send({
            codigoRespuesta: CODIGOS.API_ERROR,
        });
    }
};

// Consulta un horario y sus dias laborales dado un empleado.
exports.consultaHorarioCompleto = async(request, respuesta) => {
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
        if((consulta.id)) {
            // Si no existe.
            if(! await existeRegistro(Empleados, consulta.id)) {
                // Retornamos un mensaje de error.
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                });
            }

            datos.id = consulta.id;
        }

        if((consulta.numeroTelefonico)) {
            datos.numeroTelefonico = {
                [Op.substring]: consulta.numeroTelefonico
            };
        }

        if((consulta.nombres)) {
            datos.nombres = {
                [Op.substring]: consulta.nombres
            };
        }

        if((consulta.apellidoPaterno)) {
            datos.apellidoPaterno = {
                [Op.substring]: consulta.apellidoPaterno
            };
        }

        if((consulta.apellidoMaterno)) {
            datos.apellidoMaterno = {
                [Op.substring]: consulta.apellidoMaterno
            };
        }

        if((consulta.idRolVinculado)) {
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

        // Buscamos un registro del empleado.
        const registroVinculado = await Empleados.findOne({
            where: datos
        });

        // Consultamos el registro del horario.
        const registro = await Horarios.findOne({
            where: {
                idEmpleadoVinculado: registroVinculado.id
            },
            include: [{
                model: DiasLaborales
            }]
        });

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            registro: registro
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

// Modifica un horario y sus dias laborales dado un empleado.
exports.modificarHorarioCompleto = async(request, respuesta) => {
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

        // Lista de dias.
        const listaDias = [
            'Lunes',
            'Martes',
            'Miercoles',
            'Jueves',
            'Viernes',
            'Sabado',
            'Domingo'
        ];

        // Instanciamos la fecha del registro.
        const fecha = new Date();

        // Desempaquetamos los datos.
        const idEmpleado = consulta.id;

        const tolerancia = cuerpo.tolerancia;
        const descripcionHorario = cuerpo.descripcionHorario;

        // Primero buscamos el registro del empleado.
        const registro = await Empleados.findByPk(consulta.id);

        // Si no existe el registro.
        if(!registro) {
            // retorna un mensaje de rror.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.EMPLEADO_NO_ENCONTRADO
            });
        }

        // Buscamos el registro vinculado.
        const registroVinculadoHorario = await Horarios.findOne({
            where: {
                idEmpleadoVinculado: idEmpleado
            }
        });

        // Verificamos que exista el registro.
        if(!registroVinculadoHorario) {
            // Si no se encontro el registro, se envia un
            // codio de registro inexistente.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.HORARIO_NO_ENCONTRADO,
            });
        }

        // Lista de registros de dias laborales.
        const registrosVinculadosDiasLaborales = await DiasLaborales.findAll({
            where: {
                idHorarioVinculado: registroVinculadoHorario.id
            }
        });

        // Verificamos que existan los registros.
        if(registrosVinculadosDiasLaborales.length != 7) {
            // Si no se encontro el registro, se envia un
            // codio de registro inexistente.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DIA_LABORAL_NO_ENCONTRADO,
            });
        }

        // Realizamos el cambio de datos del registro del horario.
        if(tolerancia) {
            registroVinculadoHorario.tolerancia = tolerancia;
        }

        if(descripcionHorario) {
            registroVinculadoHorario.descripcionHorario = descripcionHorario;
        }

        registroVinculadoHorario.fechaModificacionHorario = fecha;

        // Por ultimo realizamos los cambios en los registros de
        // dias laborales.
        const cambios = registrosVinculadosDiasLaborales.map(
            (registroVinculado) => {
                // Desempaquetamos los datos.
                const esDescanso = parseInt(cuerpo[
                    'esDescanso' + listaDias[registroVinculado.dia]
                ]);
                const horaEntrada = cuerpo[
                    'horaEntrada' + listaDias[registroVinculado.dia]
                ];
                const horaSalidaDescanso = cuerpo[
                    'horaSalidaDescanso' + listaDias[registroVinculado.dia]
                ];
                const horaEntradaDescanso = cuerpo[
                    'horaEntradaDescanso' + listaDias[registroVinculado.dia]
                ];
                const horaSalida = cuerpo[
                    'horaSalida' + listaDias[registroVinculado.dia]
                ];

                // Si el dia esta marcado como descanso.
                if(esDescanso) {
                    // Guardamos el cambio en el campo.
                    registroVinculado.esDescanso = esDescanso;

                    // Limpiamos las horas de entrada,
                    // salida, inicio de descanso y fin de descanso.
                    registroVinculado.horaEntrada = null;
                    registroVinculado.horaSalidaDescanso = null;
                    registroVinculado.horaEntradaDescanso = null;
                    registroVinculado.horaSalida = null;

                // Si no esta marcado como dia de descanso.
                } else {
                    // Guardamos los cambios realizados en los demas campos.
                    if(horaEntrada) {
                        registroVinculado.horaEntrada = horaEntrada;
                    }

                    if(horaSalidaDescanso) {
                        registroVinculado.horaSalidaDescanso = horaSalidaDescanso;
                    }

                    if(horaEntradaDescanso) {
                        registroVinculado.horaEntradaDescanso = horaEntradaDescanso;
                    }

                    if(horaSalida) {
                        registroVinculado.horaSalida = horaSalida;
                    }
                }

                // Cambiamos la fecha de modificacion del registro.
                registroVinculado.fechaModificacionDiaLaboral = fecha;

                // Retornamos una promesa de guardar los cambios en la
                // base de datos.
                return registroVinculado.save();
            }
        );

        // Guardamos los cambios en el registro de horario.
        await registroVinculadoHorario.save();


        // Esperamos a que los cambios echos en los dias
        // laborales se produscan.
        await cambios.forEach(async (cambio) => {
            await cambio;
        });

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK
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
