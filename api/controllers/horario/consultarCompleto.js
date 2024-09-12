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

// Para la creacion y lectura de tokens.
const {
    getTokenPayload
} = require("../../utils/jwtConfig");

// Funciones extra.
const {
    mostrarLog
} = require("../../utils/logs");

// Modelos que usara el controlador.
const Roles = db.rol;
const Horarios = db.horario;
const Empleados = db.empleado;
const DiasLaborales = db.diaLaboral;

// Consulta un horario y sus dias laborales dado un empleado.
module.exports = async function consultaHorarioCompleto(
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

        // Construimos la consulta hacia la db.
        const datos = Object();

        // Agregamos los parametros de la consulta.
        if((consulta.id)) {
            // Si no existe.
            if(! await existeRegistro(Empleados, consulta.id)) {
                // Retornamos un mensaje de error.
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                });
            }

            datos.id = consulta.id;
        }

        if((consulta.numeroTelefonico)) {
            datos.numeroTelefonico = {
                [Op.substring]: consulta.numeroTelefonico
            };
        }

        if((consulta.nombres)) {
            datos.nombres = {
                [Op.substring]: consulta.nombres
            };
        }

        if((consulta.apellidoPaterno)) {
            datos.apellidoPaterno = {
                [Op.substring]: consulta.apellidoPaterno
            };
        }

        if((consulta.apellidoMaterno)) {
            datos.apellidoMaterno = {
                [Op.substring]: consulta.apellidoMaterno
            };
        }

        if((consulta.idRolVinculado)) {
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

        // Buscamos un registro del empleado.
        const registroVinculado = await Empleados.findOne({
            where: datos
        });

        // Consultamos el registro del horario.
        const registro = await Horarios.findOne({
            where: {
                idEmpleadoVinculado: registroVinculado.id
            },
            include: [{
                model: DiasLaborales
            }]
        });

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            registro: registro
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