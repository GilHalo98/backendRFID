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

// Modelos que usara el controlador.
const TiposDispositivos = db.tipoDispositivo;
const DispositivosIoT = db.dispositivoIoT;
const Zonas = db.zona;

// Registra un dipositivo.
exports.registrarDispositivo = async(request, respuesta) => {
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

        // Recuperamos los datos del registro.
        const descripcionDispositivo = cuerpo.descripcionDispositivo;
        const idZonaVinculada = cuerpo.idZonaVinculada;
        const idTipoDispositivoVinculado = cuerpo.idTipoDispositivoVinculado;

        // Verificamos que los datos recuperados sean validos para el registro.
        if(
            !descripcionDispositivo
            || !idZonaVinculada
            || !idTipoDispositivoVinculado
        ) {
            // Si alguno de los datos no es valido, no se realiza el registro.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            });
        }

        // Ahora buscamos por el registro vinculado al dispositivo.
        const zonaVinculada = await Zonas.findByPk(
            idZonaVinculada
        );

        // Si no existe el registro vinculado.
        if(!zonaVinculada) {
            // Retorna el mensaje de dato vinculado no existe.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Si no existe.
        if(! await existeRegistro(TiposDispositivos, idTipoDispositivoVinculado)) {
            // Retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Ahora realizamos el registro del reporte.
        const dispositivoNuevo = {
            descripcionDispositivo: descripcionDispositivo,
            fechaRegistroIoT: fecha,
            idZonaVinculada: idZonaVinculada,
            idTipoDispositivoVinculado: idTipoDispositivoVinculado
        };

        // Registramos el reporte en la base de datos.
        await DispositivosIoT.create(dispositivoNuevo);

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

// Consulta los registros en la DB.
exports.consultarDispositivo = async(request, respuesta) => {
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

        if(consulta.idZonaVinculada) {
            // Buscamos en la db el registro vinculado.
            const zonaVinculada = await Zonas.findByPk(
                consulta.idZonaVinculada
            );

            // Si no existe.
            if(!zonaVinculada) {
                // Retornamos un mensaje de error.
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                });
            }

            // Si existe, se agrega el dato a la busqueda.
            datos.idZonaVinculada = consulta.idZonaVinculada;
        }

        if(consulta.idTipoDispositivoVinculado) {
            // Si no existe.
            if(! await existeRegistro(TiposDispositivos, consulta.idTipoDispositivoVinculado)) {
                // Retornamos un mensaje de error.
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                });
            }

            // Si existe, se agrega el dato a la busqueda.
            datos.idTipoDispositivoVinculado = consulta.idTipoDispositivoVinculado;
        }

        // Consultamos el total de los registros.
        const totalRegistros = await DispositivosIoT.count({
            where: datos,
        });

        // Consultamos todos los registros.
        const registros = await DispositivosIoT.findAll({
            offset: offset,
            limit: limit,
            where: datos,
            include: [{
                model: Zonas,
            }, {
                model: TiposDispositivos,
            }]
        });

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            totalRegistros: totalRegistros,
            registros: registros
        });

    } catch(excepcion){
        console.log(excepcion);

        return respuesta.status(500).send({
            codigoRespuesta: CODIGOS.API_ERROR
        });
    }
};

// Elimina un registro de la base de datos dado un id.
exports.eliminarDispositivo = async(request, respuesta) => {
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
        const dispositivo = await DispositivosIoT.findByPk(id);

        // Si no existe el registro con el id.
        if(!dispositivo) {
            // Retorna un error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DISPOSITIVO_IOT_NO_ENCONTRADO,
            });
        }

        // Eliminamos el registro.
        await dispositivo.destroy();

        // Retornamos la respuesta de operacion ok
        // y el registro eliminado.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            registroEliminado: dispositivo
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

// Modifica un registro de la base de datos.
exports.modificarDispositivo = async(request, respuesta) => {
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
        const descripcionDispositivo = cuerpo.descripcionDispositivo;
        const idZonaVinculada = cuerpo.idZonaVinculada;
        const idTipoDispositivoVinculado = cuerpo.idTipoDispositivoVinculado;

        // Verificamos que exista un id del registro a modificar.
        if(!id) {
            // Si no, retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_BUSQUEDA_INCOMPLETOS
            });
        }

        // Buscamos el registro.
        const dispositivo = await DispositivosIoT.findByPk(id);

        // Si no se encuentra el registor, se retorna un mensaje.
        if(!dispositivo) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.DISPOSITIVO_IOT_NO_ENCONTRADO
            });
        }

        // Cambiamos los datos del registro.
        if(descripcionDispositivo) {
            dispositivo.descripcionDispositivo = descripcionDispositivo;
        }
        if(idZonaVinculada) {
            // Buscamos el registro vinculado.
            const zonaVinculada = await Zonas.findByPk(idZonaVinculada);

            // Si no se encuentra, se retorna un mensaje.
            if(!zonaVinculada) {
                return respuesta.status(200).json({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                });
            }

            // Cambiamos el registro vinculado.
            dispositivo.idZonaVinculada = idZonaVinculada;
        }
        if(idTipoDispositivoVinculado) {
            // Si no existe.
            if(! await existeRegistro(TiposDispositivos, consulta.idTipoDispositivoVinculado)) {
                // Retornamos un mensaje de error.
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                });
            }

            // Cambiamos el registro vinculado.
            dispositivo.idTipoDispositivoVinculado = idTipoDispositivoVinculado;
        }


        // Actualizamos la fehca de modificacion del registro.
        dispositivo.fechaModificacionIoT = fecha;

        // Guardamos los cambios.
        await dispositivo.save();

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

// Genera un token para el acceso del dispositivo a la api.
exports.generarTokenAcceso = async(request, respuesta) => {
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

        // Si no se ingresa un id de registro.
        if(!consulta.id) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_BUSQUEDA_INCOMPLETOS
            });
        }

        // Buscamos el registro perteneciente.
        const registro = await DispositivosIoT.findByPk(consulta.id);

        // Si no se encontro el registro, retorna un mensaje.
        if(!registro) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DISPOSITIVO_IOT_NO_ENCONTRADO
            });
        }

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            authorization: getToken({
                'idDispositivo': registro.id
            }, {})
        });

    } catch(excepcion){
        console.log(excepcion);

        return respuesta.status(500).send({
            codigoRespuesta: CODIGOS.API_ERROR
        });
    }
}