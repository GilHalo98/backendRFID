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
        console.log(excepcion);

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

        const horario = cuerpo.horario;

        // Validamos que exista la informacion necesaria para
        // realizar el registro del permiso.
        if(
            !descripcionHorario
            || !tolerancia
            || !idEmpleadoVinculado
            || !horario
        ) {
            // Si no estan completos mandamos
            // un mensaje de datos incompletos.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            });
        }

        // Validamos que la lista de descansos tenga una longitud de 7.
        if(horario.length != 7) {
            // Si no es asi, retornamos un mensaje de datos incompletos
            // para el registro.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            });
        }

        // Por cada registro de dia laboral, verificamos que este completo.
        for(let index = 0; index < horario.length; index++) {
            const elemento = horario[index];

            const dia = elemento.dia;
            const esDescanso = elemento.esDescanso;
            const horaEntrada = elemento.horaEntrada;
            const horaSalidaDescanso = elemento.horaSalidaDescanso;
            const horaEntradaDescanso = elemento.horaEntradaDescanso;
            const horaSalida = elemento.horaSalida;

            if(
                !dia
                || !esDescanso
                || !horaEntrada
                || !horaSalidaDescanso
                || !horaEntradaDescanso
                || !horaSalida
            ) {
                // Si no es asi, retornamos un mensaje de datos incompletos
                // para el registro.
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
                });
            }
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
            tolerancia: toDateTime(tolerancia),
            idEmpleadoVinculado: idEmpleadoVinculado,
            fechaRegistroHorario: fecha
        };

        // ID del horario a vincular.
        let idHorario;

        // Guardamos el registro en la DB.
        await Horarios.create(nuevoRegistro).then((registro) => {
            // Guardamos el id del registro guardado.
            idHorario = registro.id;
        });

        for(let index = 0; index < horario.length; index++) {
            const elemento = horario[index];

            const dia = elemento.dia;
            const esDescanso = elemento.esDescanso;
            const horaEntrada = elemento.horaEntrada;
            const horaSalidaDescanso = elemento.horaSalidaDescanso;
            const horaEntradaDescanso = elemento.horaEntradaDescanso;
            const horaSalida = elemento.horaSalida;

            // Creamos el registro.
            const nuevoSubRegistro = {
                dia: dia,
                esDescanso: esDescanso,
                horaEntrada: toDateTime(horaEntrada),
                horaSalidaDescanso: toDateTime(horaSalidaDescanso),
                horaEntradaDescanso: toDateTime(horaEntradaDescanso),
                horaSalida: toDateTime(horaSalida),
                fechaRegistroDia: fecha,
                idHorarioVinculada: idHorario
            };

            // Realizamos el registro del dia.
            await DiasLaborales.create(nuevoSubRegistro);
        }

        // Retornamos una respuesta de exito.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK
        });
        
    } catch(excepcion) {
        // Mostramos el error en la consola
        console.log(excepcion);

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

        const horario = cuerpo.horario;

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
            registro.tolerancia = toDateTime(tolerancia);
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

        // Por cada registro de dia laboral.
        for(let index = 0; index < horario.length; index++) {
            const elemento = horario[index];

            // Recuperamos los datos del registro.
            const dia = elemento.dia;
            const esDescanso = elemento.esDescanso;
            const horaEntrada = elemento.horaEntrada;
            const horaSalidaDescanso = elemento.horaSalidaDescanso;
            const horaEntradaDescanso = elemento.horaEntradaDescanso;
            const horaSalida = elemento.horaSalida;

            // Buscamos el registro del dia laboral.
            const subRegistro = await DiasLaborales.findOne({
                where: {
                    idSemanaLaboralVinculada: id,
                    dia: dia
                }
            });

            // Verificamos que exista el registro.
            if(!subRegistro) {
                // Si no se encontro el registro, se envia un
                // codio de registro inexistente.
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE,
                });
            }


            // Cambiamos los datos del registro.
            if(esDescanso) {
                subRegistro.esDescanso = esDescanso;
            }
            if(horaEntrada) {
                subRegistro.horaEntrada = toDateTime(horaEntrada);
            }
            if(horaSalidaDescanso) {
                subRegistro.horaSalidaDescanso = toDateTime(
                    horaSalidaDescanso
                );
            }
            if(horaEntradaDescanso) {
                subRegistro.horaEntradaDescanso = toDateTime(
                    horaEntradaDescanso
                );
            }
            if(horaSalida) {
                subRegistro.horaSalida = toDateTime(horaSalida);
            }

            // Guardamos los cambios del registro.
            await subRegistro.save();
        }

        // Retornamos un mensaje de operacion ok.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK
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
        console.log(excepcion);

        // Retornamos un codigo de error.
        return respuesta.status(500).send({
            codigoRespuesta: CODIGOS.API_ERROR,
        });
    }
};