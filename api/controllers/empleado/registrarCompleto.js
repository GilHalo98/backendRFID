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

// Modelos que usara el controlador.
const Roles = db.rol;
const Horarios = db.horario;
const Recursos = db.recurso;
const Usuarios = db.usuario;
const Empleados = db.empleado;
const DiasLaborales = db.diaLaboral;

async function registrarRecurso(
    imagenEmpleado,
    hoy
) {
    // Variables de coincidencias y nuevo registro.
    let coincidencia = undefined;
    let nuevoRegistro = undefined;

    // Buscamos que no exista otro registro con los mismos datos.
    coincidencia = await Recursos.findOne({
        where: {
            nombre: imagenEmpleado.filename
        }
    });

    // Si existe un registro con los mismos datos terminamos
    // la operacion.
    if(coincidencia) {
        return undefined;
    }

    // Creamos el registro de la imagen del empleado.
    nuevoRegistro = {
        tipo: imagenEmpleado.mimetype,
        nombre: imagenEmpleado.filename,
        data: fs.readFileSync(imagenEmpleado.path),
        fechaRegistroRecurso: hoy,
    };

    // Guardamos el registro en la DB.
    await Recursos.create(nuevoRegistro).then((registro) => {
        idImagenVinculada = registro.id;
    });

    return idImagenVinculada;
};

async function registrarEmpleado(
    nombres,
    apellidoPaterno,
    apellidoMaterno,
    numeroTelefonico,
    fechaNacimiento,
    idRolVinculado,
    idImagenVinculada,
    hoy
) {
    // Variables de coincidencias y nuevo registro.
    let coincidencia = undefined;
    let nuevoRegistro = undefined;

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
        return undefined;
    }

    // Creamos el registro.
    nuevoRegistro = {
        nombres: nombres,
        apellidoPaterno: apellidoPaterno,
        apellidoMaterno: apellidoMaterno,
        numeroTelefonico: numeroTelefonico,
        fechaNacimiento: new Date(fechaNacimiento),
        fechaRegistroEmpleado: hoy,
        idRolVinculado: idRolVinculado,
        idImagenVinculada: idImagenVinculada
    };

    // Guardamos el registro en la DB.
    await Empleados.create(nuevoRegistro).then((registro) => {
        idEmpelado = registro.id;
    });

    return idEmpelado;
};

async function registrarUsuario(
    nombreUsuario,
    password,
    idRegistroEmpleadoVinculado,
    hoy
) {
    // Variables de coincidencias y nuevo registro.
    let coincidencia = undefined;
    let nuevoRegistro = undefined;

    // Buscamos que no exista otro registro con los mismos datos.
    coincidencia = await Usuarios.findOne({
        where: {
            nombreUsuario: nombreUsuario,
        }
    });

    // Si existe un registro con los mismos datos terminamos
    // la operacion.
    if(coincidencia) {
        return undefined;
    }

    // Creamos el registro.
    nuevoRegistro = {
        nombreUsuario: nombreUsuario,
        password: password,
        fechaRegistroUsuario: hoy,
        idRegistroEmpleadoVinculado: idRegistroEmpleadoVinculado
    };

    // Guardamos el registro en la DB.
    await Usuarios.create(nuevoRegistro);

    return 1;
};

async function registrarHorario(
    descripcionHorario,
    tolerancia,
    idEmpleadoVinculado,
    hoy
) {
    // Variables de coincidencias y nuevo registro.
    let coincidencia = undefined;
    let nuevoRegistro = undefined;

    // Buscamos por registros con el id del registro vinculado.
    coincidencia = await Horarios.findOne({
        where: {
            idEmpleadoVinculado: idEmpleadoVinculado
        }
    });

    // Si existe un registro con los mismos datos terminamos
    // la operacion.
    if(coincidencia) {
        return undefined;
    }

    // Creamos el registro.
    nuevoRegistro = {
        descripcionHorario: descripcionHorario,
        tolerancia: toSQLTime(tolerancia),
        idEmpleadoVinculado: idEmpleadoVinculado,
        fechaRegistroHorario: hoy
    };

    // Guardamos el registro en la DB.
    await Horarios.create(nuevoRegistro).then((registro) => {
        idHorario = registro.id;
    });

    return idHorario;
};

async function registrarDiaLaboral(
    horarioCompleto,
    idHorarioVinculado,
    hoy
) {
    const pool = []

    const dias = Object.keys(horarioCompleto);

    for(let i = 0; i < dias.length; i ++) {
        const dia = i + 1 ;


        console.log(horarioCompleto[dias[i]]);

        const esDescanso = horarioCompleto[dias[i]].esDescanso;
        const horaEntrada = horarioCompleto[dias[i]].Entrada;
        const horaSalida = horarioCompleto[dias[i]].Salida;

        pool.push(Promise.resolve(DiasLaborales.create({
            dia: dia,
            esDescanso: esDescanso,
            horaEntrada: horaEntrada.length > 0? toSQLTime(horaEntrada) : '',
            horaSalida: horaEntrada.length > 0? toSQLTime(horaSalida) : '',
            fechaRegistroDia: hoy,
            idHorarioVinculado: idHorarioVinculado
        })));
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

// Valida el registro para el horario completo del empleado.
function validarRegistroHorario(horarioCompleto) {
    let registroValidado = true;

    const dias = Object.keys(horarioCompleto);

    for(let i = 0; i < dias.length; i ++) {
        const datos = horarioCompleto[dias[i]];

        if(!datos.esDescanso) {
            if(datos.Entrada.length <= 0 || datos.Salida <= 0) {
                registroValidado = false;

                break;
            }
        }
    }

    return registroValidado;
};

// Registra un empleado completo, con usuario, horario y dia laboral.
module.exports = async function registrarEmpleadoCompleto(
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
         * Validamos los datos desempaquetados.
         */
        const datosValidados = (!imagenEmpleado
            || !nombres
            || !apellidoPaterno
            || !apellidoMaterno
            || !idRolVinculado
            || !tolerancia
            || !descripcionHorario
            || validarRegistroHorario(horarioCompleto)
        );

        if(!datosValidados) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            });
        }

        const idImagenVinculada = await registrarRecurso(
            imagenEmpleado,
            hoy
        );

        if(!idImagenVinculada) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_YA_EXISTE
            });
        }

        const idEmpleado = await registrarEmpleado(
            nombres,
            apellidoPaterno,
            apellidoMaterno,
            numeroTelefonico,
            fechaNacimiento,
            idRolVinculado,
            idImagenVinculada,
            hoy
        );

        if(!idEmpleado) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_YA_EXISTE
            });
        }

        if(nombreUsuario && password) {
            const idUsuario = await registrarUsuario(
                nombreUsuario,
                password,
                idEmpleado,
                hoy
            );

            if(!idUsuario) {
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_YA_EXISTE
                });
            }
        }

        const idHorario = await registrarHorario(
            descripcionHorario,
            tolerancia,
            idEmpleado,
            hoy
        );

        const idDiasLaborales = await registrarDiaLaboral(
            horarioCompleto,
            idHorario,
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