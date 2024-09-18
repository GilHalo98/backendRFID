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

// Modelos que usara el controlador.
const DiasLaborales = db.diaLaboral;
const Horarios = db.horario;

const {
    mostrarLog
} = require("../../utils/logs");

// Genera un reporte de intentos de accesos a zonas.
module.exports = async function modificarDiaLaboral(
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
        const dia = cuerpo.dia;
        const esDescanso = cuerpo.esDescanso;
        const horaEntrada = cuerpo.horaEntrada;
        const horaSalidaDescanso = cuerpo.horaSalidaDescanso;
        const horaEntradaDescanso = cuerpo.horaEntradaDescanso;
        const horaSalida = cuerpo.horaSalida;
        const idHorarioVinculado = cuerpo.idHorarioVinculado;

        // Verificamos que exista un id del registro a modificar.
        if(!id) {
            // Si no, retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_BUSQUEDA_INCOMPLETOS
            });
        }

        // Buscamos el registro.
        const registro = await DiasLaborales.findByPk(id);

        // Verificamos que exista el registro.
        if(!registro) {
            // Si no se encontro el registro, se envia un
            // codio de registro inexistente.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DIA_LABORAL_NO_ENCONTRADO,
            });
        }

        // Cambiamos los datos del registro.
        if(dia) {
            registro.dia = dia;
        }
        if(esDescanso) {
            registro.esDescanso = (esDescanso == 'true');
        }
        if(horaEntrada) {
            registro.horaEntrada = horaEntrada;
        }
        if(horaSalidaDescanso) {
            registro.horaSalidaDescanso = horaSalidaDescanso;
        }
        if(horaEntradaDescanso) {
            registro.horaEntradaDescanso = horaEntradaDescanso;
        }
        if(horaSalida) {
            registro.horaSalida = horaSalida;
        }
        if(idHorarioVinculado) {
            // Verificamos que exista el registro vinculado.
            const existeRegistroVinculado = await existeRegistro(
                Horarios,
                idHorarioVinculado
            );

            // Si no existe.
            if(!existeRegistroVinculado) {
                // Retornamos un mensaje de error.
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                });
            }

            // Si existe el registro, actualizamos el dato del registro.
            registro.idHorarioVinculado = idHorarioVinculado;
        }

        // Actualizamos la fehca de modificacion del registro.
        registro.fechaModificacionDia = fecha;

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