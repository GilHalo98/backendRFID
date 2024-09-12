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

// Para la creacion y lectura de tokens.
const {
    getTokenPayload
} = require("../../utils/jwtConfig");

// Para el control de logs.
const {
    mostrarLog
} = require('../../utils/logs');

// Modelos que usara el controlador.
const Empleados = db.empleado;
const Usuarios = db.usuario;

// Guarda un registro en la base de datos.
module.exports = async function registrarUsuario(
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

        // Instanciamos la fecha del registro.
        const fecha = new Date();
        
        // Recuperamos la informacion del registro.
        const nombreUsuario = cuerpo.nombreUsuario;
        const password = cuerpo.password;
        const idRegistroEmpleadoVinculado = cuerpo.idRegistroEmpleadoVinculado;

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
        const coincidencia = await Usuarios.findOne({
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
        const nuevoRegistro = {
            nombreUsuario: nombreUsuario,
            password: password,
            fechaRegistroUsuario: fecha,
            idRegistroEmpleadoVinculado: idRegistroEmpleadoVinculado
        };

        // Guardamos el registro en la DB.
        await Usuarios.create(nuevoRegistro);

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