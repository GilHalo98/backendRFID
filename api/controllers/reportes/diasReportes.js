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


// Lista los dias del horario del empleado junto con una
// serie de banderas por dia.
module.exports = async function listarDiasHorario(request, respuesta) {
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

        // Instanciamos la fecha del dia actual.
        const hoy = new Date();

        // Desempaquetamos los datos.
        const idEmpleado = consulta.idEmpleado;

        // Si no se pasa el id del empleado.
        if(!idEmpleado) {
            // Se retorna un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_BUSQUEDA_INCOMPLETOS
            });
        }

        // Consultamos el registor del empleado.
        const registroEmpleado = await Empleados.findByPk(idEmpleado);

        // Si no se encuentra el registro de empleado.
        if(!registroEmpleado) {
            // Retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.EMPLEADO_NO_ENCONTRADO
            });
        }

        // Consultamos el registro del horario del empelado.
        const registroHorario = await Horarios.findOne({
            where: {
                idEmpleadoVinculado: registroEmpleado.id
            }
        });

        // Si no se encuentra registro del horario.
        if(!registroHorario) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.HORARIO_NO_ENCONTRADO
            });
        }

        // Por último buscamos los dias laborales del horario.
        const diasLaborales = await DiasLaborales.findAll({
            where: {
                idHorarioVinculado: registroHorario.id
            },
            order: [['dia', 'ASC']]
        });

        // Si no se encuentran los registros de los dias laborales.
        if(diasLaborales.length != 7) {
            // Retorna un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DIA_LABORAL_NO_ENCONTRADO
            });
        }

        // Procesamos los registros de los dias laborales.
        const listaDias = diasLaborales.map((registro) => {
            return {
                dia: registro.dia,
                esDescanso: registro.esDescanso
            };
        });

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            dias: listaDias
        });

    } catch(excepcion) {
        // Mostramos el error en la consola
        mostrarLog(`Error con controlador: ${excepcion}`);

        // Retornamos un codigo de error.
        return respuesta.status(500).send({
            codigoRespuesta: CODIGOS.API_ERROR,
        });
    }
};;