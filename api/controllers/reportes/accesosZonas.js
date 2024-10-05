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
const Zonas = db.zona;
const Reportes = db.reporte;
const Empleados = db.empleado;
const TiposReportes = db.tipoReporte;
const ReportesAccesos = db.reporteAcceso;

// Genera un reporte de los accesos a zona.
module.exports = async function reporteAccesosZona(
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

        // Verificamos si se selecciono un maximo de elementos
        // por pagina.
        const limit = (
            !consulta.limit?
                consulta.limit : parseInt(consulta.limit)
        );

        // Construimos la consulta hacia la db.
        const datos = Object();

        // Se desempaquetan los datost.
        datos.idZonaVinculada = consulta.idZonaVinculada;
        datos.idEmpleadoVinculado = consulta.idEmpleadoVinculado;

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
        datos.fechaRegistroReporteAcceso = {
            [Op.between]: rangoDiaReporte
        };

        // Verificamos que los datos de busqueda esten completos.
        if(!consulta.idEmpleadoVinculado || !consulta.idZonaVinculada) {
            // Si no es asi, se retorna un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_BUSQUEDA_INCOMPLETOS
            });
        }

        // Verificamos que exista el registro vinculado.
        const registroEmpleado =  await Empleados.findByPk(
            consulta.idEmpleadoVinculado
        );

        // Si no existe el registro.
        if(!registroEmpleado) {
            // Retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.EMPLEADO_NO_ENCONTRADO
            });
        }

        // Verificamos que exista el registro vinculado.
        const registroZona =  await Zonas.findByPk(
            consulta.idZonaVinculada
        );

        // Si no existe el registro.
        if(!registroZona) {
            // Retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.ZONA_NO_ENCONTRADA
            });
        }

        // Verificamos que el tipo de reporte de entrada de zona exista.
        const tipoReporteEntradaZona = await TiposReportes.findOne({
            where: {
                tagTipoReporte: 'accesoGarantizado'
            }
        });

        // Verificamos que el tipo de reporte de salida de zona exista.
        const tipoReporteSalidaZona = await TiposReportes.findOne({
            where: {
                tagTipoReporte: 'salidaZona'
            }
        });

        // si no existe, entonces retornamos un mensaje de error.
        if(!tipoReporteSalidaZona || !tipoReporteEntradaZona) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Consultamos todos los registros.
        const registros = await ReportesAccesos.findAll({
            where: datos,
            include: [{
                required: true,
                model: Reportes,
                where: {
                    idTipoReporteVinculado: {
                        [Op.or]: [
                            tipoReporteEntradaZona.id,
                            tipoReporteSalidaZona.id
                        ]
                    }
                },
                include: [{
                    model: TiposReportes
                }]
            }],
            order: [['fechaRegistroReporteAcceso', 'DESC']]
        });

        // Index de los elementos.
        let index = 0;

        // Reporte.
        const reporte = [];

        // Lo ultimo es por cada registro, calcular la diferencia en el
        // tipo de registro entre reporte de entrada y salida
        // y registrarlo como tiempo en zona.
        while(index < registros.length - 1) {
            // Consultamos los registros.
            const registroA = registros[index]; // Salida
            const registroB = registros[index + 1]; // Entrada

            // Verificamos que registroA sea de tipo salida a zona.
            if(registroA.reporte.idTipoReporteVinculado == tipoReporteSalidaZona.id) {
                // Verificamos que el registroB sea de tipo acceso de zona.
                if(registroB.reporte.idTipoReporteVinculado == tipoReporteEntradaZona.id) {
                    // Si los dos tipos de reportes son los correctos
                    // se calcula la diferencia de tiempo entre estos.
                    const tiempoEnZona = (
                        registroA.fechaRegistroReporteAcceso
                        - registroB.fechaRegistroReporteAcceso
                    );

                    // Guardamos los datos en el reporte.
                    reporte.push({
                        entrada: registroB.fechaRegistroReporteAcceso,
                        salida: registroA.fechaRegistroReporteAcceso,
                        tiempoEnZona: tiempoEnZona
                    });
                }
            }

            // Aumentamos el index en uno.
            index ++;
        }

        // Paginamos la lista de reportes.
        const pagina = reporte.slice(
            offset,
            offset + limit
        );

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            zona: registroZona,
            totalRegistros: reporte.length,
            reporte: !(offset + limit)? reporte : pagina
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