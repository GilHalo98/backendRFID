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
const { getToken, getTokenPayload } = require("../utils/jwtConfig");
const { toSQLDate } = require("../utils/utils");

// Modelos que usara el controlador.
const DiasLaborales = db.diaLaboral;
const Horarios = db.horario;

// Consulta los registros en la base de datos.
exports.consultaDiaLaboral = async(request, respuesta) => {
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

        if(consulta.dia) {
            datos.dia = consulta.dia;
        }

        if(consulta.idHorarioVinculado) {
            // Si no existe.
            if(! await existeRegistro(Horarios, consulta.idHorarioVinculado)) {
                // Retornamos un mensaje de error.
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                });
            }

            // Si existe, se agrega el dato a la busqueda.
            datos.idHorarioVinculado = consulta.idHorarioVinculado;
        }

        // Consultamos el total de los registros.
        const totalRegistros = await DiasLaborales.count({
            where: datos,
        });

        // Consultamos todos los registros.
        const registros = await DiasLaborales.findAll({
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
exports.registrarDiaLaboral = async(request, respuesta) => {
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
        const dia = cuerpo.dia;
        const esDescanso = cuerpo.esDescanso;
        const horaEntrada = cuerpo.horaEntrada;
        const horaSalidaDescanso = cuerpo.horaSalidaDescanso;
        const horaEntradaDescanso = cuerpo.horaEntradaDescanso;
        const horaSalida = cuerpo.horaSalida;
        const idHorarioVinculado = cuerpo.idHorarioVinculado;

        // Validamos que exista la informacion necesaria para
        // realizar el registro del permiso.
        if(
            !dia
            || !esDescanso
            || !horaEntrada
            || !horaSalidaDescanso
            || !horaEntradaDescanso
            || !horaSalida
            || !idHorarioVinculado
        ) {
            // Si no estan completos mandamos
            // un mensaje de datos incompletos.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            })
        }

        // Si no existe.
        if(! await existeRegistro(Horarios, idHorarioVinculado)) {
            // Retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Creamos el registro.
        const nuevoRegistro = {
            dia: dia,
            esDescanso: esDescanso,
            horaEntrada: horaEntrada,
            horaSalidaDescanso: horaSalidaDescanso,
            horaEntradaDescanso: horaEntradaDescanso,
            horaSalida: horaSalida,
            fechaRegistroDia: fecha,
            idHorarioVinculado: idHorarioVinculado,
        };

        // Guardamos el registro en la DB.
        await DiasLaborales.create(nuevoRegistro);

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
exports.modificarDiaLaboral = async(request, respuesta) => {
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
        const dia = cuerpo.dia;
        const esDescanso = cuerpo.esDescanso;
        const horaEntrada = cuerpo.horaEntrada;
        const horaSalidaDescanso = cuerpo.horaSalidaDescanso;
        const horaEntradaDescanso = cuerpo.horaEntradaDescanso;
        const horaSalida = cuerpo.horaSalida;
        const idHorarioVinculado = cuerpo.idHorarioVinculado;

        // Verificamos que exista un id del registro a modificar.
        if(!id) {
            // Si no, retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_BUSQUEDA_INCOMPLETOS
            });
        }

        // Buscamos el registro.
        const registro = await DiasLaborales.findByPk(id);

        // Verificamos que exista el registro.
        if(!registro) {
            // Si no se encontro el registro, se envia un
            // codio de registro inexistente.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DIA_LABORAL_NO_ENCONTRADO,
            });
        }

        // Cambiamos los datos del registro.
        if(dia) {
            registro.dia = dia;
        }
        if(esDescanso) {
            registro.esDescanso = esDescanso;
        }
        if(horaEntrada) {
            registro.horaEntrada = horaEntrada;
        }
        if(horaSalidaDescanso) {
            registro.horaSalidaDescanso = horaSalidaDescanso;
        }
        if(horaEntradaDescanso) {
            registro.horaEntradaDescanso = horaEntradaDescanso;
        }
        if(horaSalida) {
            registro.horaSalida = horaSalida;
        }
        if(idHorarioVinculado) {
            // Si no existe.
            if(! await existeRegistro(Horarios, idHorarioVinculado)) {
                // Retornamos un mensaje de error.
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                });
            }

            // Si existe el registro, actualizamos el dato del registro.
            registro.idHorarioVinculado = idHorarioVinculado;
        }

        // Actualizamos la fehca de modificacion del registro.
        registro.fechaModificacionDia = fecha;

        // Guardamos los cambios.
        await registro.save();

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
exports.eliminarDiaLaboral = async(request, respuesta) => {
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
        const registro = await DiasLaborales.findByPk(id);

        // Si no existe el registro con el id.
        if(!registro) {
            // Retorna un error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DIA_LABORAL_NO_ENCONTRADO,
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