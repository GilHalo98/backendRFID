// Modelos de la DB
const db = require("../models/index");

// Codigos de la API.
const respuestas = require("../utils/codigosAPI");

// Instanciamos los codigos.
const CODIGOS = new respuestas.CodigoApp();

// Operadores de sequelize para consultas
const { Op } = require("sequelize");

// Para la creacion y lectura de tokens.
const { getToken, getTokenPayload } = require("../utils/jwtConfig");

// Modelos que usara el controlador.
const Zonas = db.zona;

// Funciones extra.
const { mostrarLog } = require("../utils/logs");

// Consulta los registros en la base de datos.
exports.consultaZona = async(request, respuesta) => {
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

        if(consulta.nombreZona) {
            datos.nombreZona = {
                [Op.substring]: consulta.nombreZona
            };
        }

        if(consulta.descripcionZona) {
            datos.descripcionZona = {
                [Op.substring]: consulta.descripcionZona
            };
        }

        if(consulta.bitZona) {
            datos.bitZona = consulta.bitZona;
        }

        // Consultamos el total de los registros.
        const totalRegistros = await Zonas.count({
            where: datos,
        });

        // Consultamos todos los registros.
        const registros = await Zonas.findAll({
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
exports.registrarZona = async(request, respuesta) => {
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
        const nombreZona = cuerpo.nombreZona;
        const descripcionZona = cuerpo.descripcionZona;
        const bitZona = cuerpo.bitZona;

        // Validamos que exista la informacion necesaria para
        // realizar el registro del zona.
        if(
            !nombreZona
            || !descripcionZona
            || !bitZona
        ) {
            // Si no estan completos mandamos
            // un mensaje de datos incompletos.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            })
        }

        // Buscamos que no exista otro registro con los mismos datos.
        const coincidencia = await Zonas.findOne({
            where: {
                nombreZona: nombreZona,
                bitZona: bitZona
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
        const nuevaZona = {
            nombreZona: nombreZona,
            descripcionZona: descripcionZona,
            bitZona: bitZona,
            fechaRegistroZona: fecha
        };

        // Guardamos el registro en la DB.
        await Zonas.create(nuevaZona);

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
exports.modificarZona = async(request, respuesta) => {
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
        const nombreZona = cuerpo.nombreZona;
        const descripcionZona = cuerpo.descripcionZona;
        const bitZona = cuerpo.bitZona;

        // Verificamos que exista un id del registro a modificar.
        if(!id) {
            // Si no, retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_BUSQUEDA_INCOMPLETOS
            });
        }

        // Buscamos el registro.
        const zona = await Zonas.findByPk(id);

        // Verificamos que exista el registro.
        if(!zona) {
            // Si no se encontro el registro, se envia un
            // codio de registro inexistente.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.ZONA_NO_ENCONTRADA
            });
        }

        // Cambiamos los datos del registro.
        if(nombreZona) {
            zona.nombreZona = nombreZona;
        }
        if(descripcionZona) {
            zona.descripcionZona = descripcionZona;
        }
        if(bitZona) {
            zona.bitZona = bitZona;
        }

        // Actualizamos la fehca de modificacion del registro.
        zona.fechaModificacionZona = fecha;

        // Guardamos los cambios.
        await zona.save();

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
exports.eliminarZona = async(request, respuesta) => {
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
        const zona = await Zonas.findByPk(id);

        // Si no existe el registro con el id.
        if(!zona) {
            // Retorna un error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.ZONA_NO_ENCONTRADA,
            });
        }

        // Eliminamos el registro.
        await zona.destroy();

        // Retornamos la respuesta de operacion ok
        // y el registro eliminado.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            registroEliminado: zona
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