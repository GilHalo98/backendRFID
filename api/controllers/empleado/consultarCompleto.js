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
const Usuarios = db.usuario;
const Empleados = db.empleado;
const DiasLaborales = db.diaLaboral;


// Consulta los registros en la base de datos del empleado, completo.
module.exports = async function consultaEmpleadoCompleto(
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

        // Verificamos si se selecciono un offset.
        const offset = (
            !consulta.offset?
                consulta.offset : parseInt(consulta.offset)
        );

        // Verificamos si se selecciono un maximo de elementos por pagina.
        const limit = (
            !consulta.limit?
                consulta.limit : parseInt(consulta.limit)
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
            where: datos,
            include: [{
                model: Usuarios,
                attributes: {
                    exclude: ['password']
                }
            }, {
                model: Horarios,
                include: [{
                    model: DiasLaborales
                }]
            }]
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
            codigoRespuesta: CODIGOS.API_ERROR
        });
    }
};