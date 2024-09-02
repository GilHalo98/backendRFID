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

// Modelos que usara el controlador.
const Empleados = db.empleado;
const Usuarios = db.usuario;
const Roles = db.rol;

// Para encriptar la contraseña
const bcrypjs = require("bcryptjs");

// Para la creacion y lectura de tokens.
const { getToken, getTokenPayload } = require("../utils/jwtConfig");

// Para el control de logs.
const { mostrarLog } = require('../utils/logs');

// Consulta los registros en la base de datos.
exports.consultaUsuario = async(request, respuesta) => {
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

        if(consulta.nombreUsuario) {
            datos.nombreUsuario = {
                [Op.substring]: consulta.nombreUsuario
            };
        }

        if(consulta.idRegistroEmpleadoVinculado) {
            if(! await existeRegistro(
                Empleados,
                consulta.idRegistroEmpleadoVinculado
            )) {
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                });
            }

            datos.idRegistroEmpleadoVinculado = consulta.idRegistroEmpleadoVinculado;
        }

        // Consultamos el total de los registros.
        const totalRegistros = await Usuarios.count({
            where: datos,
        });

        // Consultamos todos los registros.
        const registros = await Usuarios.findAll({
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
exports.registrarUsuario = async(request, respuesta) => {
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
        const nombreUsuario = cuerpo.nombreUsuario;
        const password = cuerpo.password;
        const idRegistroEmpleadoVinculado = cuerpo.idRegistroEmpleadoVinculado;

        // Validamos que exista la informacion necesaria para
        // realizar el registro del usuario.
        if(
            !nombreUsuario
            || !password
            || !idRegistroEmpleadoVinculado
        ) {
            // Si no estan completos mandamos
            // un mensaje de datos incompletos.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            });
        }

        // Buscamos que el registro vinculado exista.
        if(! await existeRegistro(Empleados, idRegistroEmpleadoVinculado)) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Buscamos que no exista otro registro con los mismos datos.
        const coincidencia = await Usuarios.findOne({
            where: {
                nombreUsuario: nombreUsuario,
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
            nombreUsuario: nombreUsuario,
            password: password,
            fechaRegistroUsuario: fecha,
            idRegistroEmpleadoVinculado: idRegistroEmpleadoVinculado
        };

        // Guardamos el registro en la DB.
        await Usuarios.create(nuevoRegistro);

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
exports.OLDmodificarUsuario = async(request, respuesta) => {
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
        const nombreUsuario = cuerpo.nombreUsuario;
        const password = cuerpo.password;
        const oldPassword = cuerpo.oldPassword;
        const idRegistroEmpleadoVinculado = cuerpo.idRegistroEmpleadoVinculado;

        // Verificamos que exista un id del registro a modificar.
        if(!id) {
            // Si no, retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_BUSQUEDA_INCOMPLETOS
            });
        }

        // Buscamos el registro.
        const registro = await Usuarios.findByPk(id);

        // Verificamos que exista el registro.
        if(!registro) {
            // Si no se encontro el registro, se envia un
            // codio de registro inexistente.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.ZONA_NO_ENCONTRADO,
            });
        }

        // Cambiamos los datos del registro.
        if(nombreUsuario) {
            registro.nombreUsuario = nombreUsuario;
        }
        if(password) {
            // Si se busca modificar la contraseña, se tiene que pasar
            // la contraseña anterior.
            if(oldPassword) {
                // Comparamos las contraseñas.
                const match = await bcrypjs.compare(
                    oldPassword,
                    registro.password,
                );

                // Si las contraseñas no son las mismas, se
                // retorna un mensaje
                if(!match) {
                    return respuesta.status(200).send({
                        codigo_respuesta: CODIGOS.OLD_PASSWORD_INCORRECTA,
                    });
                }

                // Si es la misma, se cambia a la nueva contraseña.
                registro.password = password;

            } else {
                // Si no se pasa la contraseña anterior
                // se manda un mensaje
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.DATOS_PARA_MODIFICACION_INCOMPLETOS
                })
            }
        }
        if(idRegistroEmpleadoVinculado) {
            // Buscamos el registro vinculado.
            if(! await existeRegistro(Empleados, consulta.idRegistroEmpleadoVinculado)) {
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                });
            }

            // Si existe el registro, se realiza el cambio.
            registro.idRegistroEmpleadoVinculado = idRegistroEmpleadoVinculado;
        }

        // Actualizamos la fehca de modificacion del registro.
        registro.fechaModificacionUsuario = fecha;

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

// Modifica un registro de la base de datos.
exports.modificarUsuario = async(request, respuesta) => {
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
        const nombreUsuario = cuerpo.nombreUsuario;
        const password = cuerpo.password;

        // Verificamos que exista un id del registro a modificar.
        if(!id) {
            // Si no, retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_BUSQUEDA_INCOMPLETOS
            });
        }

        // Buscamos el registro.
        const registro = await Usuarios.findByPk(id);

        // Verificamos que exista el registro.
        if(!registro) {
            // Si no se encontro el registro, se envia un
            // codio de registro inexistente.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.ZONA_NO_ENCONTRADO,
            });
        }

        // Cambiamos los datos del registro.
        if(nombreUsuario) {
            registro.nombreUsuario = nombreUsuario;
        }
        if(password) {
            registro.password = password;

        } else {
            // Si no se pasa la contraseña anterior
            // se manda un mensaje
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_PARA_MODIFICACION_INCOMPLETOS
            })
        }

        // Actualizamos la fehca de modificacion del registro.
        registro.fechaModificacionUsuario = fecha;

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
exports.eliminarUsuario = async(request, respuesta) => {
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
        const registro = await Usuarios.findByPk(id);

        // Si no existe el registro con el id.
        if(!registro) {
            // Retorna un error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.USUARIO_NO_ENCONTRADO,
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

// Genera un token de secion iniciada y lo retorna al suaurio.
exports.login = async(request, respuesta) => {
    // GET Request.
    const cabecera = request.headers;
    const cuerpo = request.body;
    const parametros = request.params;
    const consulta = request.query;

    try {
        // Recuperamos la informacion del registro.
        const nombreUsuario = cuerpo.nombreUsuario;
        const password = cuerpo.password;

        // Validamos que exista la informacion necesaria para
        // realizar el login.
        if(
            !nombreUsuario
            || !password
        ) {
            // Si no estan completos mandamos
            // un mensaje de datos incompletos.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_PARA_LOGIN_INCOMPLETOS
            });
        }

        // Verificamos que exista el usuario.
        const registro = await Usuarios.findOne({
            where: {
                nombreUsuario: nombreUsuario
            },
            include: [{
                required: true,
                model: Empleados
            }]
        });

        // Si no existe el usuario, retorna un mensaje.
        if(!registro) {
            return respuesta.status(200).send({
                codigo_respuesta: CODIGOS.DATOS_PARA_LOGIN_INCORRECTOS,
            });
        }

        // Si los datos estan completos comparamos las contraseñas.
        const match = await bcrypjs.compare(
            password,
            registro.password,
        );

        // Si las contraseñas no son las mismas, se
        // retorna un mensaje
        if(!match) {
            return respuesta.status(200).send({
                codigo_respuesta: CODIGOS.DATOS_PARA_LOGIN_INCORRECTOS,
            });
        }

        // Retornamso la respuesta con el token en el header.
        return respuesta.status(200).send({
            codigo_respuesta: CODIGOS.OK,
            rol: registro.empleado.idRolVinculado,
            authorization: getToken(
                { 'idUsuario': registro.id },
                cuerpo.alwaysOn ? {} : { expiresIn: '24h' }
            )
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