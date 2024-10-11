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

// Funciones extra.
const {
    mostrarLog
} = require("../../utils/logs");

// Modelos que usara el controlador.
const DiasLaborales = db.diaLaboral;
const Horarios = db.horario;

// Genera un reporte de intentos de accesos a zonas.
module.exports = async function registrarDiaLaboralConDescanso(
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
        const dia = cuerpo.dia;
        const esDescanso = cuerpo.esDescanso;
        const horaEntrada = cuerpo.horaEntrada;
        const horaSalidaDescanso = cuerpo.horaSalidaDescanso;
        const horaEntradaDescanso = cuerpo.horaEntradaDescanso;
        const horaSalida = cuerpo.horaSalida;
        const idHorarioVinculado = cuerpo.idHorarioVinculado;

        // Validamos que exista la informacion necesaria para
        // realizar el registro del permiso.
        if(
            !dia
            || !esDescanso
            || !horaEntrada
            || !horaSalidaDescanso
            || !horaEntradaDescanso
            || !horaSalida
            || !idHorarioVinculado
        ) {
            // Si no estan completos mandamos
            // un mensaje de datos incompletos.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            })
        }

        // Verificamos que exista el registro vinculado.
        const existeREgistroVinculadoHorario = await existeRegistro(
            Horarios,
            idHorarioVinculado
        );

        // Si no existe.
        if(!existeREgistroVinculadoHorario) {
            // Retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Creamos el registro.
        const nuevoRegistro = {
            dia: dia,
            esDescanso: (esDescanso == 'true'),
            horaEntrada: horaEntrada,
            horaSalidaDescanso: horaSalidaDescanso,
            horaEntradaDescanso: horaEntradaDescanso,
            horaSalida: horaSalida,
            fechaRegistroDia: fecha,
            idHorarioVinculado: idHorarioVinculado,
        };

        // Guardamos el registro en la DB.
        await DiasLaborales.create(nuevoRegistro);

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