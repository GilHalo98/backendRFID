// Modelos de la DB
const db = require("../../models/index");

// Codigos de la API.
const respuestas = require("../../utils/codigosAPI");

// Instanciamos los codigos.
const CODIGOS = new respuestas.CodigoApp();

// Para encriptar la contraseña
const bcrypjs = require("bcryptjs");

// Para la creacion y lectura de tokens.
const {
    getToken
} = require("../../utils/jwtConfig");

// Para el control de logs.
const {
    mostrarLog
} = require('../../utils/logs');

// Modelos que usara el controlador.
const Empleados = db.empleado;
const Usuarios = db.usuario;

// Genera un token de secion iniciada y lo retorna al suaurio.
module.exports = async function login(
    request,
    respuesta
) {
    // GET Request.
    const cabecera = request.headers;
    const cuerpo = request.body;
    const parametros = request.params;
    const consulta = request.query;

    try {
        // Recuperamos la informacion del registro.
        const nombreUsuario = cuerpo.nombreUsuario;
        const password = cuerpo.password;

        // Validamos que exista la informacion necesaria para
        // realizar el login.
        if(
            !nombreUsuario
            || !password
        ) {
            // Si no estan completos mandamos
            // un mensaje de datos incompletos.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_PARA_LOGIN_INCOMPLETOS
            });
        }

        // Verificamos que exista el usuario.
        const registro = await Usuarios.findOne({
            where: {
                nombreUsuario: nombreUsuario
            },
            include: [{
                required: true,
                model: Empleados
            }]
        });

        // Si no existe el usuario, retorna un mensaje.
        if(!registro) {
            return respuesta.status(200).send({
                codigo_respuesta: CODIGOS.DATOS_PARA_LOGIN_INCORRECTOS,
            });
        }

        // Si los datos estan completos comparamos las contraseñas.
        const match = await bcrypjs.compare(
            password,
            registro.password,
        );

        // Si las contraseñas no son las mismas, se
        // retorna un mensaje
        if(!match) {
            return respuesta.status(200).send({
                codigo_respuesta: CODIGOS.DATOS_PARA_LOGIN_INCORRECTOS,
            });
        }

        // Retornamso la respuesta con el token en el header.
        return respuesta.status(200).send({
            codigo_respuesta: CODIGOS.OK,
            rol: registro.empleado.idRolVinculado,
            authorization: getToken(
                { 'idUsuario': registro.id },
                cuerpo.alwaysOn ? {} : { expiresIn: '24h' }
            )
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