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

// Registra un empleado completo, con usuario, horario y dia laboral.
module.exports = async function registrarEmpleadoCompletoConDescanso(
    request,
    respuesta
) {
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

        // Lista de dias.
        const listaDias = [
            { nombreDia: 'Lunes', id: 1 },
            { nombreDia: 'Martes', id: 2 },
            { nombreDia: 'Miercoles', id: 3 },
            { nombreDia: 'Jueves', id: 4 },
            { nombreDia: 'Viernes', id: 5 },
            { nombreDia: 'Sabado', id: 6 },
            { nombreDia: 'Domingo', id: 7 }
        ];

        // Instanciamos la fecha del registro.
        const fecha = new Date();

        // ID de imagen por default de empleado.
        let idImagenVinculada = 1;

        // Recuperamos la informacion por registro.
        const archivoImagen = request.file;

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
        const nombres = cuerpo.nombres;
        const apellidoPaterno = cuerpo.apellidoPaterno;
        const apellidoMaterno = cuerpo.apellidoMaterno;
        const numeroTelefonico = cuerpo.numeroTelefonico;
        const fechaNacimiento = cuerpo.fechaNacimiento;
        const idRolVinculado = cuerpo.idRolVinculado;

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
        const nombreUsuario = cuerpo.nombreUsuario;
        const password = cuerpo.password;
        const idRegistroEmpleadoVinculado = idEmpelado;

        // Buscamos que el registro vinculado exista.
        if(! await existeRegistro(Empleados, idRegistroEmpleadoVinculado)) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.EMPLEADO_NO_ENCONTRADO
            });
        }

        // Validamos que exista la informacion necesaria para
        // realizar el registro del usuario.
        if(!(!nombreUsuario
            || !password
            || !idRegistroEmpleadoVinculado
        )) {
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
        }

        // La proxima parte es la del registro del horario.

        // Recuperamos la informacion del registro.
        const descripcionHorario = cuerpo.descripcionHorario;
        const tolerancia = cuerpo.tolerancia;
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

        // Verificamos si el registro vinculado existe en la db.
        if(! await existeRegistro(Horarios, idHorario)) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Mapeamos los datos de la lista de los dias laborales.
        const nuevosRegistros = listaDias.map((diaSemana) => {
            // Datos del registro del dia laboral.
            const dia = diaSemana.id;
            const esDescanso = cuerpo[
                'esDescanso' + diaSemana.nombreDia
            ];
            const horaEntrada = cuerpo[
                'horaEntrada' + diaSemana.nombreDia
            ];
            const horaSalidaDescanso = cuerpo[
                'horaSalidaDescanso' + diaSemana.nombreDia
            ];
            const horaEntradaDescanso = cuerpo[
                'horaEntradaDescanso' + diaSemana.nombreDia
            ];
            const horaSalida = cuerpo[
                'horaSalida' + diaSemana.nombreDia
            ];
            const idHorarioVinculado = idHorario;

            // Validamos que exista la informacion necesaria para
            // realizar el registro del permiso.
            if(!(!esDescanso || !idHorarioVinculado)) {
                // Si existe la informacion, entonces se agrega a
                // la lista de datos validos.
                return DiasLaborales.create({
                    dia: dia,
                    esDescanso: esDescanso,
                    horaEntrada: toSQLTime(horaEntrada),
                    horaSalidaDescanso: toSQLTime(horaSalidaDescanso),
                    horaEntradaDescanso: toSQLTime(horaEntradaDescanso),
                    horaSalida: toSQLTime(horaSalida),
                    fechaRegistroDia: fecha,
                    idHorarioVinculado: idHorarioVinculado
                });
            }
        });

        // Si los registros del horario laboral son diferente de 7,
        // se retorna un error de datos de registro incompletos.
        if(nuevosRegistros.length != 7) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            });
        }

        // Guardamos los nuevos registros.
        await Promise.all(nuevosRegistros);

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