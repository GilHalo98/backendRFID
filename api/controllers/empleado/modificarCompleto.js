// Modelos de la DB
const db = require("../../models/index");

// Codigos de la API.
const respuestas = require("../../utils/codigosAPI");

// Instanciamos los codigos.
const CODIGOS = new respuestas.CodigoApp();

// Operadores de sequelize para consultas
const {
    Op
} = require("sequelize");

// Funcion para verificar que el registro exista en la DB.
const {
    existeRegistro
} = require("../../utils/registros");

// Manipulacion de ficheros y directorios.
const fs = require("fs");

// Para la creacion y lectura de tokens.
const {
    getTokenPayload
} = require("../../utils/jwtConfig");

// Para la generacion de username y password.
const {
    toSQLTime
}  = require("../../utils/utils");

// Funciones extra.
const {
    mostrarLog
} = require("../../utils/logs");

// Modelos que usara el controlador.
const Roles = db.rol;
const Horarios = db.horario;
const Recursos = db.recurso;
const Usuarios = db.usuario;
const Empleados = db.empleado;
const DiasLaborales = db.diaLaboral;

// Modifica un registro en la base de datos del empleado, completo.
module.exports = async function modificarEmpleadoCompleto(
    request,
    respuesta
) {
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

        // Instanciamos la fecha de la modificacion del registro.
        const fecha = new Date();

        // Desempaquetamos los datos del registro.
        const archivoImagen = request.file;

        const idEmpleado = consulta.id;
        const nombres = cuerpo.nombres;
        const apellidoPaterno = cuerpo.apellidoPaterno;
        const apellidoMaterno = cuerpo.apellidoMaterno;
        const numeroTelefonico = cuerpo.numeroTelefonico;
        const fechaNacimiento = cuerpo.fechaNacimiento;
        const idRolVinculado = cuerpo.idRolVinculado;

        const nombreUsuario = cuerpo.nombreUsuario;
        const password = cuerpo.password;

        const descripcionHorario = cuerpo.descripcionHorario;
        const tolerancia = cuerpo.tolerancia;

        // Verificamos que exista un id del registro a modificar.
        if(!idEmpleado) {
            // Si no, retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_BUSQUEDA_INCOMPLETOS
            });
        }

        // Buscamos el registro.
        const registro = await Empleados.findByPk(idEmpleado);

        // Verificamos que exista el registro.
        if(!registro) {
            // Si no se encontro el registro, se envia un
            // codio de registro inexistente.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.EMPLEADO_NO_ENCONTRADO,
            });
        }

        // Consultamos el registro del recurso.
        const registroVinculadoRecurso = await Recursos.findByPk(
            registro.idImagenVinculada
        );

        // Verificamos que exista un recurso para modificar.
        if(archivoImagen) {
            // Buscamos por un registro con el mismo nombre de archivo.
            const registroExistenteRecurso = await Recursos.findOne({
                where: {
                    nombre: archivoImagen.filename
                }
            });

            // Si existe un registro con los mismos datos terminamos
            // la operacion.
            if(registroExistenteRecurso) {
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_YA_EXISTE
                });
            }

            // Guardamos todos los cambios.
            registroVinculadoRecurso.tipo = archivoImagen.mimetype;
            registroVinculadoRecurso.nombre = archivoImagen.filename;
            registroVinculadoRecurso.data = fs.readFileSync(
                archivoImagen.path
            );
            registroVinculadoRecurso.fechaModificacionRecurso = fecha;
        }

        // Buscamos el registor vinculado.
        const registroVinculadoUsuario = await Usuarios.findOne({
            where: {
                idRegistroEmpleadoVinculado: idEmpleado
            }
        });

        // Verificamos que exista el registro.
        if(!registroVinculadoUsuario) {
            // Si no se encontro el registro, se envia un
            // codio de registro inexistente.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.USUARIO_NO_ENCONTRADO,
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

        // Lo primero es cambiar el registro del empleado.
        if(nombres) {
            registro.nombres = nombres;
        }

        if(apellidoPaterno) {
            registro.apellidoPaterno = apellidoPaterno;
        }

        if(apellidoMaterno) {
            registro.apellidoMaterno = apellidoMaterno;
        }

        if(numeroTelefonico) {
            registro.numeroTelefonico = numeroTelefonico;
        }

        if(fechaNacimiento) {
            registro.fechaNacimiento = fechaNacimiento;
        }

        if(idRolVinculado) {
            // Verificamos que el registro vinculado exista.
            if(await existeRegistro(Roles, idRolVinculado)) {
                // Si existe, cambiamos registro vinculado.
                registro.idRolVinculado = idRolVinculado;
            }
        }

        registro.fechaModificacionEmpleado = fecha;

        // Ahora cambiamos los datos del registro de usuario.
        if(nombreUsuario) {
            // Verificamos que no exista un registro con el mismo nombre
            // de ususario.
            const registroExistente = await Usuarios.findOne({
                where: {
                    idRegistroEmpleadoVinculado: {
                        [Op.ne]: idEmpleado
                    },
                    nombreUsuario: nombreUsuario
                }
            });

            // Si no existe el registro.
            if(!registroExistente) {
                // Realizamos el cambio de nombre de usuario.
                registroVinculadoUsuario.nombreUsuario = nombreUsuario;

            } else {
                // Si ya existe, entonces retornamos un error.
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_YA_EXISTE
                });
            }
        }

        if(password) {
            registroVinculadoUsuario.password = password;
        }

        registroVinculadoUsuario.fechaModificacionUsuario = fecha;

        // Realizamos el cambio de datos del registro del horario.
        if(tolerancia) {
            registroVinculadoHorario.tolerancia = toSQLTime(tolerancia);
        }

        if(descripcionHorario) {
            registroVinculadoHorario.descripcionHorario = descripcionHorario;
        }

        registroVinculadoUsuario.fechaModificacionHorario = fecha;

        // Por ultimo realizamos los cambios en los registros de
        // dias laborales.
        const cambios = await registrosVinculadosDiasLaborales.map(
            async (registroDiaLaboral) => {
                // Desempaquetamos los datos.
                const esDescanso = parseInt(cuerpo[
                    'esDescanso' + listaDias[registroDiaLaboral.dia - 1]
                ]);

                const horaEntrada = cuerpo[
                    'horaEntrada' + listaDias[registroDiaLaboral.dia - 1]
                ];

                const horaSalidaDescanso = cuerpo[
                    'horaSalidaDescanso' + listaDias[registroDiaLaboral.dia - 1]
                ];

                const horaEntradaDescanso = cuerpo[
                    'horaEntradaDescanso' + listaDias[registroDiaLaboral.dia - 1]
                ];

                const horaSalida = cuerpo[
                    'horaSalida' + listaDias[registroDiaLaboral.dia - 1]
                ];

                // Realizamos los cambios.
                if(esDescanso) {
                    registroDiaLaboral.esDescanso = esDescanso;

                    registroDiaLaboral.horaEntrada = null;
                    registroDiaLaboral.horaSalidaDescanso = null;
                    registroDiaLaboral.horaEntradaDescanso = null;
                    registroDiaLaboral.horaSalida = null;

                // Si no esta marcado como dia de descanso.
                } else {
                    // Guardamos el cambio de si el dia es descanso.
                    registroDiaLaboral.esDescanso = esDescanso;

                    // Guardamos los cambios realizados en el registro.
                    if(horaEntrada) {
                        registroDiaLaboral.horaEntrada = toSQLTime(horaEntrada);
                    }

                    if(horaSalidaDescanso) {
                        registroDiaLaboral.horaSalidaDescanso = toSQLTime(horaSalidaDescanso);
                    }

                    if(horaEntradaDescanso) {
                        registroDiaLaboral.horaEntradaDescanso = toSQLTime(horaEntradaDescanso);
                    }

                    if(horaSalida) {
                        registroDiaLaboral.horaSalida = toSQLTime(horaSalida);
                    }
                }

                registroDiaLaboral.fechaModificacionDiaLaboral = fecha;

                // Retornamos una promesa de guardar los cambios
                // en la base de datos.
                return registroDiaLaboral.save();
            }
        );

        // Por ultimo guardamos los cambios en la base de datos.

        // Guardamos los cambios del registro de empleado.
        await registro.save();

        // Guardamos los cambios en el registro de usuario.
        await registroVinculadoUsuario.save();

        // Guardamos los cambios en el registro de horario.
        await registroVinculadoHorario.save();

        // Guardamos los nuevos registros.
        await Promise.all(cambios);

        // Por ultimo guardamos los cambios en el registro de recurso.
        await registroVinculadoRecurso.save();

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
