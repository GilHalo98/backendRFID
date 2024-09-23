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

// Operadores de sequelize para consultas
const {
    Op
} = require("sequelize");

// Funciones de manipulacion de tiempo.
const {
    deserealizarSemana,
    rangoDia
} = require("../../utils/tiempo");

// Funciones extra.
const {
    mostrarLog
} = require("../../utils/logs");

// Rutinas
const {
    existeRegistro
} = require("../../utils/registros");

// Modelos que usara el controlador.
const Reportes = db.reporte;
const Empleados = db.empleado;
const TiposReportes = db.tipoReporte;
const DispositivosIoT = db.dispositivoIoT;
const ReportesActividades = db.reporteActividad;

// Genera un reporte de las actividades.
module.exports = async function reporteActividadesDispositivo(
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
        const payload = await getTokenPayload(
            cabecera.authorization
        );

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

        // Instanciamos la semana del reporte.
        const semanaReporte = deserealizarSemana(
            consulta.semanaReporte
        );

        // Instanciamos el rango del dia del reporte.
        const rangoDiaReporte = rangoDia(
            consulta.dia,
            semanaReporte
        );

        // Guardamos el rango del dia de la consulta de los reportes.
        datos.fechaRegistroReporteActividad = {
            [Op.between]: rangoDiaReporte
        };

        if(consulta.idEmpleadoVinculado) {
            // Verificamos que exista el registro vinculado.
            const existeRegistroVinculadoEmpleado =  await existeRegistro(
                Empleados,
                consulta.idEmpleadoVinculado
            );

            // Si no existe el registro.
            if(!existeRegistroVinculadoEmpleado) {
                // Retornamos un mensaje de error.
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                });
            }

            // Si existe, se agrega el dato a la busqueda.
            datos.idEmpleadoVinculado = consulta.idEmpleadoVinculado;
        }

        if(consulta.idDispositivoVinculado) {
            // Verificamos que exista el registro vinculado.
            const existeRegistroVinculadoDispositivo =  await existeRegistro(
                DispositivosIoT,
                consulta.idDispositivoVinculado
            );

            // Si no existe el registro.
            if(!existeRegistroVinculadoDispositivo) {
                // Retornamos un mensaje de error.
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                });
            }
            // Si existe, se agrega el dato a la busqueda.
            datos.idDispositivoVinculado = consulta.idDispositivoVinculado;
        }

        // Consultamos el tipo de repote para actividad inicada.
        const tipoReporteActividadIniciada = await TiposReportes.findOne({
            where: {
                tagTipoReporte: 'actividadIniciada'
            }
        });

        // Consultamos el tipo de repote para actividad finalizada.
        const tipoReporteActividadFinalizada = await TiposReportes.findOne({
            where: {
                tagTipoReporte: 'actividadFinalizada'
            }
        });

        // Si alguno de los tipos de reporte no existe, entonces se
        // envia un mensaje de error.
        if(!tipoReporteActividadIniciada || !tipoReporteActividadFinalizada) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Index de los elementos.
        let index = 0;

        // Reporte.
        const reporte = [];

        // Consultamos todos los registros.
        const registros = await ReportesActividades.findAll({
            offset: offset,
            limit: limit,
            where: datos,
            include: [{
                required: true,
                model: Reportes,
                where: {
                    idTipoReporteVinculado: {
                        [Op.or]: [
                            tipoReporteActividadIniciada.id,
                            tipoReporteActividadFinalizada.id
                        ]
                    }
                },
                include: [{
                    model: TiposReportes
                }]
            }],
            order: [['fechaRegistroReporteActividad', 'DESC']]
        });

        // Lo ultimo es por cada registro, calcular la diferencia en el
        // tipo de registro entre reporte de entrada y salida
        // y registrarlo como tiempo en zona.
        while(index < registros.length) {
            // Consultamos los registros.
            const registroA = registros[index];
            const registroB = registros[index + 1];

            // Verificamos que registroA sea de tipo acceso a zona.
            if(registroA.reporte.idTipoReporteVinculado != tipoReporteActividadFinalizada.id) {
                // Si no es asi, se salta el ciclo.
                index ++;

                break;
            }

            // Verificamos que el registroB sea de tipo salida de zona.
            if(registroB.reporte.idTipoReporteVinculado != tipoReporteActividadIniciada.id) {
                // Si no es asi, se salta el ciclo.
                index ++;

                break;
            }

            // Si los dos tipos de reportes son los correctos
            // se calcula la diferencia de tiempo entre estos.
            const tiempoEnActividad = (
                registroA.fechaRegistroReporteActividad
                - registroB.fechaRegistroReporteActividad
            );

            // Guardamos los datos en el reporte.
            reporte.push({
                inicio: registroB.fechaRegistroReporteActividad,
                fin: registroA.fechaRegistroReporteActividad,
                tiempoEnActividad: tiempoEnActividad
            });

            // Acumulamos en el index.
            index += 2;
        }

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            totalRegistros: reporte.length,
            reporte: reporte
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