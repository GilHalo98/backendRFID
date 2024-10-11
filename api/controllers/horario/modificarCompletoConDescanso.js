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

// Para la creacion y lectura de tokens.
const {
    getTokenPayload
} = require("../../utils/jwtConfig");

// Funciones extra.
const {
    mostrarLog
} = require("../../utils/logs");

// Modelos que usara el controlador.
const Horarios = db.horario;
const Empleados = db.empleado;
const DiasLaborales = db.diaLaboral;

// Modifica un horario y sus dias laborales dado un empleado.
module.exports = async function modificarHorarioCompletoConDescanso(
    request,
    respuesta
) {
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

        // Instanciamos la fecha del registro.
        const fecha = new Date();

        // Desempaquetamos los datos.
        const idEmpleado = consulta.id;

        const tolerancia = cuerpo.tolerancia;
        const descripcionHorario = cuerpo.descripcionHorario;

        // Primero buscamos el registro del empleado.
        const registro = await Empleados.findByPk(consulta.id);

        // Si no existe el registro.
        if(!registro) {
            // retorna un mensaje de rror.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.EMPLEADO_NO_ENCONTRADO
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

        // Realizamos el cambio de datos del registro del horario.
        if(tolerancia) {
            registroVinculadoHorario.tolerancia = tolerancia;
        }

        if(descripcionHorario) {
            registroVinculadoHorario.descripcionHorario = descripcionHorario;
        }

        registroVinculadoHorario.fechaModificacionHorario = fecha;

        // Por ultimo realizamos los cambios en los registros de
        // dias laborales.
        const cambios = registrosVinculadosDiasLaborales.map(
            (registroVinculado) => {
                // Desempaquetamos los datos.
                const esDescanso = parseInt(cuerpo[
                    'esDescanso' + listaDias[registroVinculado.dia - 1]
                ]);
                const horaEntrada = cuerpo[
                    'horaEntrada' + listaDias[registroVinculado.dia - 1]
                ];
                const horaSalidaDescanso = cuerpo[
                    'horaSalidaDescanso' + listaDias[registroVinculado.dia - 1]
                ];
                const horaEntradaDescanso = cuerpo[
                    'horaEntradaDescanso' + listaDias[registroVinculado.dia - 1]
                ];
                const horaSalida = cuerpo[
                    'horaSalida' + listaDias[registroVinculado.dia - 1]
                ];

                // Si el dia esta marcado como descanso.
                if(esDescanso) {
                    // Guardamos el cambio en el campo.
                    registroVinculado.esDescanso = esDescanso;

                    // Limpiamos las horas de entrada,
                    // salida, inicio de descanso y fin de descanso.
                    registroVinculado.horaEntrada = null;
                    registroVinculado.horaSalidaDescanso = null;
                    registroVinculado.horaEntradaDescanso = null;
                    registroVinculado.horaSalida = null;

                // Si no esta marcado como dia de descanso.
                } else {
                    // Guardamos el cambio de si el dia es descanso.
                    registroVinculado.esDescanso = esDescanso;

                    // Guardamos los cambios realizados en los demas campos.
                    if(horaEntrada) {
                        registroVinculado.horaEntrada = horaEntrada;
                    }

                    if(horaSalidaDescanso) {
                        registroVinculado.horaSalidaDescanso = horaSalidaDescanso;
                    }

                    if(horaEntradaDescanso) {
                        registroVinculado.horaEntradaDescanso = horaEntradaDescanso;
                    }

                    if(horaSalida) {
                        registroVinculado.horaSalida = horaSalida;
                    }
                }

                // Cambiamos la fecha de modificacion del registro.
                registroVinculado.fechaModificacionDiaLaboral = fecha;

                // Retornamos una promesa de guardar los cambios en la
                // base de datos.
                return registroVinculado.save();
            }
        );

        // Guardamos los cambios en el registro de horario.
        await registroVinculadoHorario.save();

        // Esperamos a que los cambios echos en los dias
        // laborales se produscan.
        await Promise.all(cambios);

        // Retornamos los registros encontrados.
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
