// Modelos de la DB
const db = require("../../models/index");

// Codigos de la API.
const respuestas = require("../../utils/codigosAPI");

// Funciones del token
const {
    getTokenPayload
} = require('../../utils/jwtConfig')

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
const Reportes = db.reporte;
const Empleados = db.empleado;
const DispositivosIoT = db.dispositivoIoT;
const ReportesActividades = db.reporteActividad;

// Modifica un registro de la base de datos.
module.exports = async function modificarReporteActividad(
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

        const idReporteVinculado = cuerpo.idReporteVinculado;
        const idEmpleadoVinculado = cuerpo.idEmpleadoVinculado;
        const idDispositivoVinculado = cuerpo.idDispositivoVinculado;

        // Verificamos que exista un id del registro a modificar.
        if(!id) {
            // Si no, retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_BUSQUEDA_INCOMPLETOS
            });
        }

        // Buscamos el registro.
        const registro = await ReportesActividades.findByPk(id);

        // Verificamos que exista el registro.
        if(!registro) {
            // Si no se encontro el registro, se envia un
            // codio de registro inexistente.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REPORTE_NO_ENCONTRADO,
            });
        }

        // Cambiamos los datos del registro.
        if(idReporteVinculado) {
            if(! await existeRegistro(Reportes, idReporteVinculado)) {
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                });
            }

            registro.idReporteVinculado = idReporteVinculado;
        }
        if(idEmpleadoVinculado) {
            if(! await existeRegistro(Empleados, idEmpleadoVinculado)) {
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                });
            }

            registro.idEmpleadoVinculado = idEmpleadoVinculado;
        }
        if(idDispositivoVinculado) {
            if(! await existeRegistro(DispositivosIoT, idDispositivoVinculado)) {
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                });
            }

            registro.idDispositivoVinculado = idDispositivoVinculado;
        }

        // Actualizamos la fehca de modificacion del registro.
        registro.fechaModificacionReporteActividad = fecha;

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