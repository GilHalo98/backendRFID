// Manipulacion de ficheros y directorios.
const fs = require("fs");

// Modelos de la DB
const db = require("../../models/index");

// Codigos de la API.
const respuestas = require("../../utils/codigosAPI");

// Instanciamos los codigos.
const CODIGOS = new respuestas.CodigoApp();

// Funcion para verificar que el registro exista en la DB.
const {
    existeRegistro
} = require("../../utils/registros");

const {
    numeroDiaANombreDia
} = require("../../utils/tiempo");

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
const horario = require("../../models/horario");

// Modelos que usara el controlador.
const Roles = db.rol;
const Horarios = db.horario;
const Recursos = db.recurso;
const Usuarios = db.usuario;
const Empleados = db.empleado;
const DiasLaborales = db.diaLaboral;

async function modificarRecurso(
    registro,
    imagenEmpleado,
    hoy
) {
    // Buscamos que no exista otro registro con los mismos datos.
    const coincidencia = await Recursos.findOne({
        where: {
            nombre: imagenEmpleado.filename
        }
    });

    // Si existe un registro con los mismos datos terminamos
    // la operacion.
    if(coincidencia) {
        return undefined;
    }

    // Guardamos todos los cambios.
    registro.tipo = imagenEmpleado.mimetype;
    registro.nombre = imagenEmpleado.filename;
    registro.data = fs.readFileSync(
        imagenEmpleado.path
    );
    registro.fechaModificacionRecurso = hoy;

    await registro.save();

    return 1;
};

async function modificarEmpleado(
    registro,
    nombres,
    apellidoPaterno,
    apellidoMaterno,
    numeroTelefonico,
    fechaNacimiento,
    idRolVinculado,
    hoy
) {

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

        } else {
            return undefined;
         }
    }

    registro.fechaModificacionEmpleado = hoy;


    await registro.save();

    return 1;
};

async function modificarUsuario(
    registro,
    nombreUsuario,
    password,
    hoy
) {
    // Ahora cambiamos los datos del registro de usuario.
    if(nombreUsuario) {
        // Verificamos que no exista un registro con el mismo nombre
        // de ususario.
        const coincidencia = await Usuarios.findOne({
            where: {
                idRegistroEmpleadoVinculado: {
                    [Op.ne]: registro.idRegistroEmpleadoVinculado
                },
                nombreUsuario: nombreUsuario
            }
        });

        // Si no existe el registro.
        if(!coincidencia) {
            // Realizamos el cambio de nombre de usuario.
            registro.nombreUsuario = nombreUsuario;

        } else {
            // Si ya existe, entonces retornamos un error.
            return undefined;
        }
    }

    if(password) {
        registro.password = password;
    }

    registro.fechaModificacionUsuario = hoy;

    return 1;
};

async function modificarHorario(
    registro,
    idEmpleadoVinculado,
    descripcionHorario,
    tolerancia,
    hoy
) {
    // Buscamos por registros con el id del registro vinculado.
    const coincidencia = await Horarios.findOne({
        where: {
            idEmpleadoVinculado: idEmpleadoVinculado
        }
    });

    // Si existe un registro con los mismos datos terminamos
    // la operacion.
    if(coincidencia) {
        return undefined;
    }
    // Realizamos el cambio de datos del registro del horario.
    if(tolerancia) {
        registro.tolerancia = toSQLTime(tolerancia);
    }

    if(descripcionHorario) {
        registro.descripcionHorario = descripcionHorario;
    }

    registro.fechaModificacionHorario = hoy;

    // Guardamos el registro en la DB.
    registro.save();

    return 1;
};

async function modificarDiaLaboral(
    registros,
    horarioCompleto,
    hoy
) {
    const pool = []

    for(let i = 0; i < registros.length; i ++) {
        const registro = registros[i];

        const cambios = horarioCompleto[numeroDiaANombreDia(registro.dia)];

        registro.esDescanso = cambios.esDescanso;
        registro.horaEntrada = cambios.Entrada?
            toSQLTime(cambios.Entrada) : '';
        registro.horaSalida = cambios.Salida?
            toSQLTime(cambios.Salida) : '';
        registro.fechaModificacionDiaLaboral = hoy;

        pool.push(Promise.resolve(registro.save()));
    }

    await Promise.all(pool);

    return 1;
};

// Desempaqueta el registro del horario completo del empleado.
function desempaquetarRegistroHorarioCompleto(cuerpo) {
    // Desempaquetamos los campos del cuerpo.
    const campos = Object.keys(cuerpo);

    /**
     * Filtramos unicamente los campos que necesitamos.
     */

    // Instancia de campos filtrados y formateados.
    const camposFiltrados = {};

    // Filtros de los campos.
    const filtros = []

    // Preparamos el filtro de los campos.
    for(let i = 1; i <= 7; i ++) {
        // Instanciamos el nombre del dia.
        const nombreDia = numeroDiaANombreDia(i);

        // Lo agregamos a los filtros.
        filtros.push(nombreDia);

        // Instanciamos el campo filtrado y su formato.
        camposFiltrados[nombreDia] = {};
    }

    // Por cada campo.
    campos.forEach((campo) => {
        // Por cada filtro.
        filtros.forEach((filtro) => {
            // Si el campo incluye el filtro.
            if(campo.includes(filtro)) {
                // Si el campo es de tipo descanso.
                if(campo.includes('esDescanso')) {
                    // Agregamos el campo filtrado al formato.
                    camposFiltrados[filtro]['esDescanso'] = cuerpo[
                        campo
                    ].toLowerCase() == 'true'?
                        true : false;
                }

                // Si el campo es de tipo entrada.
                if(campo.includes('Entrada')) {
                    // Agregamos el campo filtrado al formato.
                    camposFiltrados[filtro]['Entrada'] = camposFiltrados[
                        filtro
                    ]['esDescanso']? '' : cuerpo[campo];
                }

                // Si el campo es de tipo salida.
                if(campo.includes('Salida')) {
                    // Agregamos el campo filtrado al formato.
                    camposFiltrados[filtro]['Salida'] = camposFiltrados[
                        filtro
                    ]['esDescanso']? '' : cuerpo[campo];

                }

                // Terminamos el ciclo.
                return;
            }
        });
    });

    return camposFiltrados;
};

// Registra un empleado completo, con usuario, horario y dia laboral.
module.exports = async function modificarEmpleadoCompleto(
    request,
    respuesta
) {
    // POST Request.
    const cabecera = request.headers;
    const cuerpo = request.body;
    const parametros = request.params;

    try {
        /**
         * Desempaquetamos y validamos el token.
         */

        // Desencriptamos el payload del token.
        const payload = await getTokenPayload(cabecera.authorization);

        // Verificamos que el payload sea valido.
        if(!payload) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.TOKEN_INVALIDO
            });
        }

        /**
         * Instanciamos la fecha actual.
         */
        const hoy = new Date();

        /**
         * Desempaquetamos los datos del request.
         */
        const idEmpleado = cuerpo.idEmpleado;

        const imagenEmpleado = request.file;

        const nombres = cuerpo.nombres;
        const apellidoPaterno = cuerpo.apellidoPaterno;
        const apellidoMaterno = cuerpo.apellidoMaterno;
        const numeroTelefonico = cuerpo.numeroTelefonico;
        const fechaNacimiento = cuerpo.fechaNacimiento;
        const idRolVinculado = cuerpo.idRolVinculado;

        const nombreUsuario = cuerpo.nombreUsuario;
        const password = cuerpo.password;

        const tolerancia = cuerpo.tolerancia;
        const descripcionHorario = cuerpo.descripcionHorario;

        const horarioCompleto = desempaquetarRegistroHorarioCompleto(
            cuerpo
        );

        /**
         * Validamos los datos necesarios para realizar la modificaicon
         */
        if(!idEmpleado) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_BUSQUEDA_INCOMPLETOS
            });
        }

        /**
         * Consultamos todos los registros a modificar.
         */

        const registroEmpleado = await Empleados.findByPk(idEmpleado);

        if(!registroEmpleado) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.EMPLEADO_NO_ENCONTRADO
            });
        }

        const registroRecurso = await Recursos.findByPk(
            registroEmpleado.idImagenVinculada
        );

        if(!registroRecurso) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.RECURSO_NO_ENCONTRADO
            });
        }

        const registroUsuario = await Usuarios.findOne({
            where: {
                idRegistroEmpleadoVinculado: registroEmpleado.id
            }
        });

        const registroHorario = await Horarios.findOne({
            where: {
                idEmpleadoVinculado: registroEmpleado.id
            }
        });

        if(!registroHorario) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.HORARIO_NO_ENCONTRADO
            });
        }

        const registrosDiasLaborales = await DiasLaborales.findAll({
            where: {
                idHorarioVinculado: registroHorario.id
            }
        });

        if(registrosDiasLaborales.length < 7) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DIA_LABORAL_NO_ENCONTRADO
            });
        }

        // Empezamos con la modificacion.
        if(imagenEmpleado) {
            await modificarRecurso(
                registroRecurso,
                imagenEmpleado,
                hoy
            );
        }

        await modificarEmpleado(
            registroEmpleado,
            nombres,
            apellidoPaterno,
            apellidoMaterno,
            numeroTelefonico,
            fechaNacimiento,
            idRolVinculado,
            hoy
        );

        if(nombreUsuario || password) {
            await modificarUsuario(
                registroUsuario,
                nombreUsuario,
                password,
                hoy
            );
        }

        await modificarHorario(
            registroHorario,
            idEmpleado,
            descripcionHorario,
            tolerancia,
            hoy
        );

        await modificarDiaLaboral(
            registrosDiasLaborales,
            horarioCompleto,
            hoy
        );

        // Retornamos un codigo de error.
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