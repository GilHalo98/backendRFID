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
const Roles = db.rol
const Permisos = db.permiso;

// Consulta los registros en la base de datos.
exports.consultaRol = async(request, respuesta) => {
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

        if(consulta.rolTrabajador) {
            datos.rolTrabajador = {
                [Op.substring]: consulta.rolTrabajador
            };
        }

        if(consulta.descripcionRol) {
            datos.descripcionRol = {
                [Op.substring]: consulta.descripcionRol
            };
        }

        if(consulta.bitRol) {
            datos.bitRol = consulta.bitRol;
        }

        if(consulta.idPermisoVinculado) {
            // Si no existe.
            if(! await existeRegistro(Permisos, consulta.idPermisoVinculado)) {
                // Retornamos un mensaje de error.
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                });
            }

            // Si existe, se agrega el dato a la busqueda.
            datos.idPermisoVinculado = consulta.idPermisoVinculado;
        }

        // Consultamos el total de los registros.
        const totalRegistros = await Roles.count({
            where: datos,
        });

        // Consultamos todos los registros.
        const registros = await Roles.findAll({
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
exports.registrarRol = async(request, respuesta) => {
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
        const rolTrabajador = cuerpo.rolTrabajador;
        const descripcionRol = cuerpo.descripcionRol;
        const bitRol = cuerpo.bitRol;
        const idPermisoVinculado = cuerpo.idPermisoVinculado;

        // Validamos que exista la informacion necesaria para
        // realizar el registro del permiso.
        if(
            !rolTrabajador
            || !descripcionRol
            || !idPermisoVinculado
            || !bitRol
        ) {
            // Si no estan completos mandamos
            // un mensaje de datos incompletos.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            })
        }

        // Si no existe.
        if(! await existeRegistro(Permisos, idPermisoVinculado)) {
            // Retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Buscamos que no exista otro registro con los mismos datos.
        const coincidencia = await Roles.count({
            where: {
                rolTrabajador: rolTrabajador
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
            rolTrabajador: rolTrabajador,
            descripcionRol: descripcionRol,
            fechaRegistroRol: fecha,
            bitRol: bitRol,
            idPermisoVinculado: idPermisoVinculado
        };

        // Guardamos el registro en la DB.
        await Roles.create(nuevoRegistro);

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
exports.modificarRol = async(request, respuesta) => {
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
        const rolTrabajador = cuerpo.rolTrabajador;
        const descripcionRol = cuerpo.descripcionRol;
        const bitRol = cuerpo.bitRol;
        const idPermisoVinculado = cuerpo.idPermisoVinculado;

        // Verificamos que exista un id del registro a modificar.
        if(!id) {
            // Si no, retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_BUSQUEDA_INCOMPLETOS
            });
        }

        // Buscamos el registro.
        const rol = await Roles.findByPk(id);

        // Verificamos que exista el registro.
        if(!rol) {
            // Si no se encontro el registro, se envia un
            // codio de registro inexistente.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.ROL_NO_ENCONTRADO,
            });
        }

        // Cambiamos los datos del registro.
        if(rolTrabajador) {
            rol.rolTrabajador = rolTrabajador;
        }
        if(descripcionRol) {
            rol.descripcionRol = descripcionRol;
        }
        if(bitRol) {
            rol.bitRol = bitRol;
        }
        if(idPermisoVinculado) {
            // Si no existe.
            if(! await existeRegistro(Permisos, idPermisoVinculado)) {
                // Retornamos un mensaje de error.
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                });
            }

            // Si existe el registro, actualizamos el dato del registro.
            rol.idPermisoVinculado = idPermisoVinculado;
        }

        // Actualizamos la fehca de modificacion del registro.
        rol.fechaModificacionRol = fecha;

        // Guardamos los cambios.
        await rol.save();

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
exports.eliminarRol = async(request, respuesta) => {
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
        const rol = await Roles.findByPk(id);

        // Si no existe el registro con el id.
        if(!rol) {
            // Retorna un error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.ROL_NO_ENCONTRADO,
            });
        }

        // Eliminamos el registro.
        await rol.destroy();

        // Retornamos la respuesta de operacion ok
        // y el registro eliminado.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            registroEliminado: rol
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