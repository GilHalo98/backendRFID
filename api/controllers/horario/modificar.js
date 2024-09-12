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
const Empleados = db.empleado;

// Modifica un registro de la base de datos.
module.exports = async function modificarHorario(
    request,
    respuesta
) {
    // PUT Request.
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

        // Instanciamos la fecha de la modificacion del registro.
        const fecha = new Date();

        // Recuperamos la informacion del registro.
        const id = consulta.id;

        const descripcionHorario = cuerpo.descripcionHorario;
        const tolerancia = cuerpo.tolerancia;
        const idEmpleadoVinculado = cuerpo.idEmpleadoVinculado;

        // Verificamos que exista un id del registro a modificar.
        if(!id) {
            // Si no, retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_BUSQUEDA_INCOMPLETOS
            });
        }

        // Buscamos el registro.
        const registro = await Horarios.findByPk(id);

        // Verificamos que exista el registro.
        if(!registro) {
            // Si no se encontro el registro, se envia un
            // codio de registro inexistente.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.HORARIO_NO_ENCONTRADO,
            });
        }

        // Cambiamos los datos del registro.
        if(descripcionHorario) {
            registro.descripcionHorario = descripcionHorario;
        }
        if(tolerancia) {
            registro.tolerancia = toSQLTime(tolerancia);
        }

        if(idEmpleadoVinculado) {
            // Si no existe.
            if(! await existeRegistro(Empleados, idEmpleadoVinculado)) {
                // Retornamos un mensaje de error.
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                });
            }

            registro.idEmpleadoVinculado = idEmpleadoVinculado;
        }

        // Actualizamos la fehca de modificacion del registro.
        registro.fechaModificacionHorario = fecha;

        // Guardamos los cambios.
        await registro.save();

        // Retornamos un mensaje de operacion ok.
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