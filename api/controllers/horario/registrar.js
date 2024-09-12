// Modelos de la DB
const db = require("../../models/index");

// Codigos de la API.
const respuestas = require("../../utils/codigosAPI");

// Instanciamos los codigos.
const CODIGOS = new respuestas.CodigoApp();

// Para la creacion y lectura de tokens.
const {
    getTokenPayload
} = require("../../utils/jwtConfig");

// Incluimos la funcion de formateo de fechas.
const {
    toSQLTime
} = require("../../utils/utils");

// Funciones extra.
const {
    mostrarLog
} = require("../../utils/logs");

// Modelos que usara el controlador.
const Horarios = db.horario;

// Guarda un registro en la base de datos.
module.exports = async function registrarHorario(
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
        const descripcionHorario = cuerpo.descripcionHorario;
        const tolerancia = cuerpo.tolerancia;
        const idEmpleadoVinculado = cuerpo.idEmpleadoVinculado;

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
        const coincidencia = await Horarios.findOne({
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
        const nuevoRegistro = {
            descripcionHorario: descripcionHorario,
            tolerancia: toSQLTime(tolerancia),
            idEmpleadoVinculado: idEmpleadoVinculado,
            fechaRegistroHorario: fecha
        };

        // Guardamos el registro en la DB.
        await Horarios.create(nuevoRegistro);

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