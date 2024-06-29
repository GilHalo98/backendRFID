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

// Manipulacion de ficheros y directorios.
const fs = require("fs");

// Para la creacion y lectura de tokens.
const { getTokenPayload } = require("../utils/jwtConfig");

// Para la generacion de username y password.
const { generarNombreUsuario, generarPassword }  = require("../utils/utils");

// Modelos que usara el controlador.
const Empleados = db.empleado;
const Permisos = db.permiso;
const Recursos = db.recurso;
const Usuarios = db.usuario;
const Roles = db.rol;

// Consulta los registros en la base de datos.
exports.consultaEmpleado = async(request, respuesta) => {
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

        if(consulta.numeroTelefonico) {
            datos.numeroTelefonico = {
                [Op.substring]: consulta.numeroTelefonico
            };
        }

        if(consulta.nombres) {
            datos.nombres = {
                [Op.substring]: consulta.nombres
            };
        }

        if(consulta.apellidoPaterno) {
            datos.apellidoPaterno = {
                [Op.substring]: consulta.apellidoPaterno
            };
        }

        if(consulta.apellidoMaterno) {
            datos.apellidoMaterno = {
                [Op.substring]: consulta.apellidoMaterno
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

        // Consultamos el total de los registros.
        const totalRegistros = await Empleados.count({
            where: datos,
        });

        // Consultamos todos los registros.
        const registros = await Empleados.findAll({
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
exports.registrarEmpleado = async(request, respuesta) => {
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
        const nombres = cuerpo.nombres;
        const apellidoPaterno = cuerpo.apellidoPaterno;
        const apellidoMaterno = cuerpo.apellidoMaterno;
        const numeroTelefonico = cuerpo.numeroTelefonico;
        const fechaNacimiento = cuerpo.fechaNacimiento;
        const idRolVinculado = cuerpo.idRolVinculado;

        // Informacion del registro de la imagen del registro.
        let idImagenVinculada = 1;

        // Validamos que exista la informacion necesaria para
        // realizar el registro del registro.
        if(
            !nombres
            || !apellidoPaterno
            || !apellidoMaterno
            || !numeroTelefonico
            || !fechaNacimiento
            || !idRolVinculado
        ) {
            // Si no estan completos mandamos
            // un mensaje de datos incompletos.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            });
        }

        // Verificamos que los registros vinculados existan.
        if(! await existeRegistro(Roles, idRolVinculado)) {
            // Retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Buscamos que no exista otro registro con los mismos datos.
        const coincidencia = await Empleados.findOne({
            where: {
                nombres: nombres,
                apellidoPaterno: apellidoPaterno,
                apellidoMaterno: apellidoMaterno,
                numeroTelefonico: numeroTelefonico
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
            nombres: nombres,
            apellidoPaterno: apellidoPaterno,
            apellidoMaterno: apellidoMaterno,
            numeroTelefonico: numeroTelefonico,
            fechaNacimiento: new Date(fechaNacimiento),
            fechaRegistroEmpleado: fecha,
            idRolVinculado: idRolVinculado,
            idImagenVinculada: idImagenVinculada
        };
        
        // Guardamos el registro en la DB.
        await Empleados.create(nuevoRegistro);

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
exports.modificarEmpleado = async(request, respuesta) => {
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
        const nombres = cuerpo.nombres;
        const apellidoPaterno = cuerpo.apellidoPaterno;
        const apellidoMaterno = cuerpo.apellidoMaterno;
        const numeroTelefonico = cuerpo.numeroTelefonico;
        const fechaNacimiento = cuerpo.fechaNacimiento;
        const idRolVinculado = cuerpo.idRolVinculado;
        const archivoImagen = request.file;

        // Verificamos que exista un id del registro a modificar.
        if(!id) {
            // Si no, retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_BUSQUEDA_INCOMPLETOS
            });
        }

        // Buscamos el registro.
        const registro = await Empleados.findByPk(id);

        // Verificamos que exista el registro.
        if(!registro) {
            // Si no se encontro el registro, se envia un
            // codio de registro inexistente.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.EMPLEADO_NO_ENCONTRADO,
            });
        }

        // Cambiamos los datos del registro.
        if(nombres) {
            registro.nombres = nombres;
        }
        if(apellidoMaterno) {
            registro.apellidoMaterno = apellidoMaterno;
        }
        if(apellidoPaterno) {
            registro.apellidoPaterno = apellidoPaterno;
        }
        if(numeroTelefonico) {
            registro.numeroTelefonico = numeroTelefonico;
        }
        if(fechaNacimiento) {
            registro.fechaNacimiento = new Date(fechaNacimiento);
        }
        if(idRolVinculado) {
            // Verificamos que los registros vinculados existan.
            if(! await existeRegistro(Roles, idRolVinculado)) {
                // Retornamos un mensaje de error.
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                });
            }
            registro.idRolVinculado = idRolVinculado;
        }
        if(archivoImagen) {
            // Creamos el registro de la imagen del empleado.
            const nuevaImagen = {
                tipo: archivoImagen.mimetype,
                nombre: archivoImagen.filename,
                data: fs.readFileSync(archivoImagen.path),
                fechaRegistroRecurso: fecha,
            };

            // Guardamos el registro en la DB.
            await Recursos.create(nuevaImagen).then((registro) => {
                registro.idImagenVinculada = registro.id;
            });
        }

        // Actualizamos la fehca de modificacion del empleado.
        registro.fechaModificacionEmpleado = fecha;

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
exports.eliminarEmpleado = async(request, respuesta) => {
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
        const registro = await Empleados.findByPk(id);

        // Si no existe el registro con el id.
        if(!registro) {
            // Retorna un error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.EMPLEADO_NO_ENCONTRADO,
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

// Registra un empleado completo, con usuario, horario y dia laboral.
exports.registrarEmpleadoCompleto = async(request, respuesta) => {
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
        
        // ID de imagen por default de empleado.
        let idImagenVinculada = 1;

        // Recuperamos la informacion por registro.
        const archivoImagen = request.file;
        const informacionEmpleado = cuerpo.informacionEmpleado;
        const informacionUsuario = cuerpo.informacionUsuario;
        const informacionHorario = cuerpo.informacionHorario;
        const informacionDiasLaborales = cuerpo.informacionDiasLaborales;

        // ID del registro del empelado.
        let idEmpelado = undefined;

        // ID del registro del horario.
        let idHorario = undefined;
        
        // Variables de coincidencias y nuevo registro.
        let coincidencia = undefined;
        let nuevoRegistro = undefined;

        // Separamos los registros por partes, primero registramos
        // la imagen del empleado.

        // Validamos que exista la informacion necesaria para
        // realizar el registro del empleado.
        if(!archivoImagen) {
            // Si no estan completos mandamos
            // un mensaje de datos incompletos.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            });
        }

        // Buscamos que no exista otro registro con los mismos datos.
        coincidencia = await Recursos.findOne({
            where: {
                nombre: archivoImagen.filename
            }
        });

        // Si existe un registro con los mismos datos terminamos
        // la operacion.
        if(coincidencia) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_YA_EXISTE
            });
        }

        // Creamos el registro de la imagen del empleado.
        nuevoRegistro = {
            tipo: archivoImagen.mimetype,
            nombre: archivoImagen.filename,
            data: fs.readFileSync(archivoImagen.path),
            fechaRegistroRecurso: fecha,
        };

        // Guardamos el registro en la DB.
        await Recursos.create(nuevoRegistro).then((registro) => {
            idImagenVinculada = registro.id;
        });

        // La siguiente parte es para el registro del empleado.

        // Recuperamos la informacion del registro.
        const nombres = informacionEmpleado.nombres;
        const apellidoPaterno = informacionEmpleado.apellidoPaterno;
        const apellidoMaterno = informacionEmpleado.apellidoMaterno;
        const numeroTelefonico = informacionEmpleado.numeroTelefonico;
        const fechaNacimiento = informacionEmpleado.fechaNacimiento;
        const idRolVinculado = informacionEmpleado.idRolVinculado;

        // Validamos que exista la informacion necesaria para
        // realizar el registro del registro.
        if(
            !nombres
            || !apellidoPaterno
            || !apellidoMaterno
            || !numeroTelefonico
            || !fechaNacimiento
            || !idRolVinculado
        ) {
            // Si no estan completos mandamos
            // un mensaje de datos incompletos.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            });
        }

        // Verificamos que los registros vinculados existan.
        if(! await existeRegistro(Roles, idRolVinculado)) {
            // Retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Buscamos que no exista otro registro con los mismos datos.
        coincidencia = await Empleados.findOne({
            where: {
                nombres: nombres,
                apellidoPaterno: apellidoPaterno,
                apellidoMaterno: apellidoMaterno,
                numeroTelefonico: numeroTelefonico
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
        nuevoRegistro = {
            nombres: nombres,
            apellidoPaterno: apellidoPaterno,
            apellidoMaterno: apellidoMaterno,
            numeroTelefonico: numeroTelefonico,
            fechaNacimiento: new Date(fechaNacimiento),
            fechaRegistroEmpleado: fecha,
            idRolVinculado: idRolVinculado,
            idImagenVinculada: idImagenVinculada
        };
        
        // Guardamos el registro en la DB.
        await Empleados.create(nuevoRegistro).then((registro) => {
            idEmpelado = registro.id;
        });

        // La siguiente parte es para el usuario del empelado,
        // este registro es meramente ocional y util para acceso
        // al sistema.

        // Recuperamos la informacion del registro.
        const nombreUsuario = informacionUsuario.nombreUsuario;
        const password = informacionUsuario.password;
        const idRegistroEmpleadoVinculado = idEmpelado;

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
        coincidencia = await Usuarios.findOne({
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
        nuevoRegistro = {
            nombreUsuario: nombreUsuario,
            password: password,
            fechaRegistroUsuario: fecha,
            idRegistroEmpleadoVinculado: idRegistroEmpleadoVinculado
        };

        // Guardamos el registro en la DB.
        await Usuarios.create(nuevoRegistro);

        // La proxima parte es la del registro del horario.

        // Recuperamos la informacion del registro.
        const descripcionHorario = informacionHorario.descripcionHorario;
        const tolerancia = informacionHorario.tolerancia;
        const idEmpleadoVinculado = idEmpelado;

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
        coincidencia = await Horarios.findOne({
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
        nuevoRegistro = {
            descripcionHorario: descripcionHorario,
            tolerancia: toSQLTime(tolerancia),
            idEmpleadoVinculado: idEmpleadoVinculado,
            fechaRegistroHorario: fecha
        };

        // Guardamos el registro en la DB.
        await Horarios.create(nuevoRegistro).then((registro) => {
            idHorario = registro.id;
        });

        // Por ultimo la parte de los dias laborales, en este
        // caso se registra de uno por uno.
        await informacionDiasLaborales.forEach(async (informacionDiaLaboral) => {
            // Recuperamos la informacion del registro.
            const dia = informacionDiaLaboral.dia;
            const esDescanso = informacionDiaLaboral.esDescanso;
            const horaEntrada = informacionDiaLaboral.horaEntrada;
            const horaSalidaDescanso = informacionDiaLaboral.horaSalidaDescanso;
            const horaEntradaDescanso = informacionDiaLaboral.horaEntradaDescanso;
            const horaSalida = informacionDiaLaboral.horaSalida;
            const idHorarioVinculado = idHorario;

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
                esDescanso: (esDescanso == 'true'),
                horaEntrada: horaEntrada,
                horaSalidaDescanso: horaSalidaDescanso,
                horaEntradaDescanso: horaEntradaDescanso,
                horaSalida: horaSalida,
                fechaRegistroDia: fecha,
                idHorarioVinculado: idHorarioVinculado,
            };

            // Guardamos el registro en la DB.
            await DiasLaborales.create(nuevoRegistro);
        });

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