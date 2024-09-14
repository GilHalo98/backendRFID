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

// Para verificar la existencia de un registro en la db.
const {
    existeRegistro
} = require("../../utils/registros");

// Funciones extra.
const {
    mostrarLog
} = require("../../utils/logs");

// Modelos que usara el controlador.
const Zonas = db.zona;
const Reportes = db.reporte;
const Empleados = db.empleado;
const TiposReportes = db.tipoReporte;
const ReportesAccesos = db.reporteAcceso;
const DispositivosIoT = db.dispositivoIoT;

// Registra un reporte.
module.exports = async function registrarReporteAcceso(
    request,
    respuesta
) {
    // POST Request.
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

        // Desempaquetamos datos del payload.
        const idDispositivo = payload.idDispositivo;

        // Instanciamos la fecha del registro.
        const fecha = new Date();

        // Verificamos que los datos para el registro del reporte esten
        // completos, sino es asi, retornamos un mensaje de error.
        if(!cuerpo.resolucion || !cuerpo.idEmpleadoVinculado || !cuerpo.salida) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.DATOS_REGISTRO_INCOMPLETOS
            });
        }

        // Recuperamos los datos del reporte.
        const resolucion = (
            !cuerpo.resolucion?
                cuerpo.resolucion : parseInt(cuerpo.resolucion)
        );

        const salida = (
            !cuerpo.salida?
                cuerpo.salida : parseInt(cuerpo.salida)
        );

        const idEmpleadoVinculado = cuerpo.idEmpleadoVinculado;

        // Verificamos que el dispositivo este registrado en la DB.
        const registroVinculadoDispositivo = await DispositivosIoT.findByPk(
            idDispositivo
        );

        // Si no es asi, entonces retorna un mensaje de error.
        if(!registroVinculadoDispositivo) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Verificamos si existe el registro vinculado del empleado.
        const registroVinculadoEmpleado = await Empleados.findByPk(
            idEmpleadoVinculado
        );

        // Si no existen el registro del
        // empleado entoces retorna un error.
        if(!registroVinculadoEmpleado) {
            return respuesta.status(200).json({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Verificamos que exista el registro vinculado de la zona.
        const registroVinculadoZona = await Zonas.findByPk(
            registroVinculadoDispositivo.idZonaVinculada
        );

        // Si no es asi, entonces retorna un mensaje de error.
        if(!registroVinculadoZona) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Verificamos que le tipo de reporte vinculado exista.
        const tipoReporteAcceso = await TiposReportes.findOne({
            where: {
                tagTipoReporte: resolucion?
                    salida? 'salidaZona' : 'accesoGarantizado' : 'accesoNegado'
            }
        });

        // Si no es asi, retornamos un mensaje de error.
        if(!tipoReporteAcceso) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Inicializamos los datos vinculados al reporte.
        const descripcionReporte = salida?
            `Salida ${
                resolucion? 'concedida' : 'negada'
            } al empelado ${
                registroVinculadoEmpleado.nombres
            } ${
                registroVinculadoEmpleado.apellidoPaterno
            } ${
                registroVinculadoEmpleado.apellidoMaterno
            } de la zona ${
                registroVinculadoZona.nombreZona
            }` : `Acceso ${
                resolucion? 'concedido' : 'negado'
            } al empelado ${
                registroVinculadoEmpleado.nombres
            } ${
                registroVinculadoEmpleado.apellidoPaterno
            } ${
                registroVinculadoEmpleado.apellidoMaterno
            } a la zona ${
                registroVinculadoZona.nombreZona
            }`;

        const idReporteVinculado = undefined;

        // Registramos el reporte.
        await Reportes.create({
            descripcionReporte: descripcionReporte,
            fechaRegistroReporte: fecha,
            idTipoReporteVinculado: tipoReporteAcceso.id

        // Al terminar el guardado del nuevo registro
        // guardamos el id del registro del reporte.
        }).then((registro) => {
            idReporteVinculado = registro.id;
        });

        // Ahora registramos el reporte de acceso.
        await ReportesAccesos.create({
            fechaRegistroReporteAcceso: fecha,
            idReporteVinculado: idReporteVinculado,
            idEmpleadoVinculado: idEmpleadoVinculado,
            idZonaVinculada: registroDispositivo.idZonaVinculada
        });

        // Retornamos un mensaje de ok.
        return respuesta.status(200).json({
            codigoRespuesta: CODIGOS.OK
        });

    } catch(excepcion) {
        // Mostramos la excepción en la consola.
        mostrarLog(`Error con controlador: ${excepcion}`);

        // Retornamso el codigo del error de la api.
        return respuesta.status(500).send({
            codigoRespuesta: CODIGOS.API_ERROR
        });
    }
};