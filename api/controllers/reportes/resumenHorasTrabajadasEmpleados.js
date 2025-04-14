/**
 * Genera un reporte resumen de las horas trabajadas de todos los
 * empleados en la DB, dado una semana.
 */

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
    msToTime,
    rangoDia,
    rangoSemana,
    dateDiaSemana,
    ajustarTimeZone,
    deserealizarSemana,
    rangoReporteDiaLaboral,
} = require("../../utils/tiempo");

// Funciones extra.
const {
    toSQLDate,
    toDateTime,
} = require("../../utils/utils");

const {
    mostrarLog
} = require("../../utils/logs");

// Modelos que usara el controlador.
const Zonas = db.zona
const Reportes = db.reporte;
const Horarios = db.horario;
const Empleados = db.empleado;
const DiasLaborales = db.diaLaboral;
const TiposReportes = db.tipoReporte;
const ReportesAccesos = db.reporteAcceso;
const ReportesChequeos = db.reporteChequeo;

// Calculamos el tiempo laboral esperado del empleado en el día.
function calcularTiempoLaboralEsperado(registroDiaLaboral) {
    /**
     * Calcula el tiempo laboral esperado del día.
     * 
     * PARAMS:
     *  - registroDiaLaboral: Registro del dia laboral del horario
     *      del empleado.
     * 
     * RETURNS:
     *  - tiempoLaboralEsperado: Tiempo en ms esperado del dia laboral.
     */

    const fechaEntrada = toDateTime(
        registroDiaLaboral.horaEntrada
    );

    const fechaSalida = toDateTime(
        registroDiaLaboral.horaSalida
    );

    // Instanciamos el tiempo laboral esperado.
    const tiempoLaboralEsperado = fechaSalida - fechaEntrada;

    // Retornamos el tiempo esperado.
    return tiempoLaboralEsperado;
};

// Calcula los tiempos del reporte, horas totales en el trabajo, extras
// y retrasos.
function calcularTiemposReporte(
    fechaReporte,
    reporteEntrada,
    reporteSalida,
    registroDiaLaboral
) {
    /**
     * La función calcula el delta entre la salida y la entrada, así
     * como las horas extra y los retrasos del empleado.
     * 
     * PARAMS:
     *  - fechaReprote: La fecha a la que pertenece el reprote.
     * 
     *  - reporteEntrada: Registro del reporte de entrada del empleado.
     *
     *  - reporteSalida: Registro del reporte de salida del empleado.
     *
     *  - registroDiaLaboral: Registro del dia laboral en el horario.
     *
     * RETURNS:
     *  - horasCalculadas: Arreglo con las horas calculadas en donde: [
     *          fechaReporte: Fecha a la que pertenece el reporte.
     *          entrada: Registro de entrada.
     *          salida: Registro de salida.
     *          tiempoExtra: Tiempo extra total en ms.
     *          tiempoRetraso: Tiempo de retraso total en ms.
     *          tiempoLaboral: Tiempo laboral total en ms.
     *      ]
     */

    // Calculamos el tiempo laboral esperado dado el horario del empleado.
    const tiempoLaboralEsperado = calcularTiempoLaboralEsperado(
        registroDiaLaboral
    );

    // Calculamos el tiempo laboral total.
    const tiempoLaboralTotal = (!reporteEntrada || !reporteSalida)? 0 : (
        reporteSalida.fechaRegistroReporteChequeo
        - reporteEntrada.fechaRegistroReporteChequeo
    );

    // tiempo extra total calculado.
    let tiempoExtraTotal = 0;

    // Tiempo retraso total calculado.
    let tiempoRetrasoTotal = 0;

    // Si existe reporte de entrada.
    if(reporteEntrada) {
        // Instanciamos una fecha de entrada.
        const horaEntrada = new Date(
            reporteEntrada.fechaRegistroReporteChequeo
        );

        // Desempaquetamos la hora de entrada y lo convertimos a tiempo.
        const tiempoEntrada = registroDiaLaboral.horaEntrada.split(':').map(
            (stringTiempo) => {
                return parseInt(stringTiempo);
            }
        );

        // Establecemos en la fecha de entrada el tiempo de entrada.
        horaEntrada.setHours(
            tiempoEntrada[0],
            tiempoEntrada[1],
            tiempoEntrada[2],
            0
        );

        // Quitamos el offset del tiempo establecido en la hora de
        // entrada.
        ajustarTimeZone(horaEntrada, true);

        // Realizamos el calculo del tiempo de retraso.
        tiempoRetrasoTotal = (
            reporteEntrada.fechaRegistroReporteChequeo - horaEntrada
        );
    }

    // Si existe reporte de salida.
    if(reporteSalida) {
        // Instanciamos una fecha de salida.
        const horaSalida = new Date(
            reporteSalida.fechaRegistroReporteChequeo
        );

        // Desempaquetamos la hora de salida y lo convertimos a tiempo.
        const tiempoSalida = registroDiaLaboral.horaSalida.split(':').map(
            (stringTiempo) => {
                return parseInt(stringTiempo);
            }
        );

        // Establecemos en la fecha de salida el tiempo de entrada.
        horaSalida.setHours(
            tiempoSalida[0],
            tiempoSalida[1],
            tiempoSalida[2],
            0
        );

        // Quitamos el offset del tiempo establecido en la hora de
        // entrada.
        ajustarTimeZone(horaSalida, true);

        
        // Realizamos el calculo del tiempo extra.
        tiempoExtraTotal = (
            reporteSalida.fechaRegistroReporteChequeo - horaSalida
        );
        console.log(
            msToTime(tiempoLaboralTotal),
            msToTime(tiempoLaboralEsperado),
            msToTime(tiempoLaboralTotal - tiempoLaboralEsperado)
        );
    }

    // Retornamos el arreglo con las horas calculadas.
    return [
        fechaReporte,
        !reporteEntrada?
            "" : reporteEntrada.fechaRegistroReporteChequeo,
        !reporteSalida?
            "" : reporteSalida.fechaRegistroReporteChequeo,
        tiempoExtraTotal < 0?
            0 : tiempoExtraTotal,
        tiempoRetrasoTotal < 0?
            0 : tiempoRetrasoTotal,
        tiempoLaboralTotal,
    ];
};

// Calcula los tiempos de acceso de las zonas.
function calcularTiemposAcceso(
    registrosReportesAccesos,
    tipoReporteAccesoZona,
    tipoReporteSalidaZona
) {
    /**
     * Calcula los tiempos de acceso de las zonas.
     * PARAMS:
     *  - registrosReportesAcceos: Registros de reportes de accesos.
     * 
     *  - tipoReporteAccesoZona: Tipo de reporte para los reportes
     *      de accesos.
     * 
     *  - tipoReporteSalidaZona: Tipos de reportes para los reportes
     *      de salida de zona.
     * 
     *  RETURNS:
     *  - reporteAccesos: Arreglo con los tiempos en zonas del empelado donde: [
     *          Fecha del registro,
     *          Nombre de zona,
     *          Hora de acceso,
     *          Hora de salida,
     *          Total de tiempo en zona
     *      ]
     * 
     * Comparamos los reportes en pares, el registroA y registroB
     * registroA es el registro mas antiguo del conjunto, este es
     * correspondiente al registro de acceos, registroB es el mas actual
     * corresponde al registro de salida de zona, si estos registros
     * son similares en zona y con correspondencia al tipo asumido,
     * entonces hay continuidad entre la entrada y salida de la zona,
     * se calcula el delta entre la fecha de expedición y se suben 2
     * registros en el arreglo, sino, se sube 1 y se continua con el
     * algoritmo.
     */

    // Arreglo con los tiempos en zonas del empelado.
    const reporteAccesos = [];

    // Recuperamos los registros auxiliares de la pila.
    let registroA = registrosReportesAccesos.pop();
    let registroB = registrosReportesAccesos.pop();

    // Mientras existan registros por procesar.
    while(registrosReportesAccesos.length > 0) {
        // si existe continuidad con los registros.
        if(
            registroA.idZonaVinculada == registroB.idZonaVinculada
            && registroA.reporte.idTipoReporteVinculado == tipoReporteAccesoZona.id
            && registroB.reporte.idTipoReporteVinculado == tipoReporteSalidaZona.id
        ) {
            // Instanciamos las fechas de registro como objetos fecha.
            const fechaAcceso = new Date(registroA.fechaRegistroReporteAcceso);
            const fechaSalida = new Date(registroB.fechaRegistroReporteAcceso);

            // Calculamos el tiempo en zona del empleado.
            const tiempoEnZona = fechaSalida - fechaAcceso;

            // Guardamos los datos del reporte.
            reporteAccesos.push([
                fechaAcceso,
                registroA.zona.nombreZona,
                fechaAcceso,
                fechaSalida,
                tiempoEnZona
            ]);

            // Nos movemos dos posiciones en los registros.
            registroA = registrosReportesAccesos.pop();
            registroB = registrosReportesAccesos.pop();

        // Si no existe continuidad.
        } else {
            // Nos movemos una posicion en los registos.
            registroA = registroB;
            registroB = registrosReportesAccesos.pop();
        }
    }

    // Retornamos los datos.
    return reporteAccesos;
};

// Genera un reporte de un empleado dado.
async function generarReporteEmpleado(
    registroEmpleado,
    semanaReporte,
    tipoReporteEntrada,
    tipoReporteEntradaRetraso,
    tipoReporteSalida,
    tipoReporteSalidaExtras,
    tipoReporteAccesoZona,
    tipoReporteSalidaZona
) {
    // Reporte de empleado generado.
    const reporteEmpleado = [];

    // Instanciamos el nombre completo del empleado.
    const nombreCompletoEmpleado = `${
        registroEmpleado.nombres
    } ${
        registroEmpleado.apellidoPaterno
    } ${
        registroEmpleado.apellidoMaterno
    }`;

    // Consultamos todos los reportes de accesos a zonas, ordenados
    // por fecha de expedicion.
    const registrosReportesAcceos = await ReportesAccesos.findAll({
        where: {
            idEmpleadoVinculado: registroEmpleado.id,
            fechaRegistroReporteAcceso: {
                [Op.between]: semanaReporte
            }
        },
        include: [{
            model: Reportes,
            include: [{
                model: TiposReportes,
                required: true,
                id: {
                    [Op.or]: [
                        tipoReporteAccesoZona.id,
                        tipoReporteSalidaZona.id
                    ]
                }
            }]
        }, {
            model: Zonas
        }],
        order: [['fechaRegistroReporteAcceso', 'DESC']]
    });

    // Calculamos el tiempo de acceso por cada zona.
    const reporteAccesos = calcularTiemposAcceso(
        registrosReportesAcceos,
        tipoReporteAccesoZona,
        tipoReporteSalidaZona
    );

    // Por cada semana laboral, consultamos los reportes de
    // chequeos de los empleados.
    for(let dia = 1; dia <= 7; dia++) {
        // Consultamos el registro del dia laboral del empleado
        // vinculado al dia de la semana del reporte.
        const registroDiaLaboral = await DiasLaborales.findOne({
            where: {
                dia: dia,
                idHorarioVinculado: registroEmpleado.horario.id
            }
        });

        // Instanciamos el rango del reporte.
        const rangoReporte =  rangoReporteDiaLaboral(
            dia,
            semanaReporte,
            registroDiaLaboral
        );

        // Consultamos el reporte de entrada.
        const reporteEntrada = await ReportesChequeos.findOne({
            where: {
                idEmpleadoVinculado: registroEmpleado.id,
                fechaRegistroReporteChequeo: {
                    [Op.between]: rangoReporte
                }
            },
            include: [{
                required: true,
                model: Reportes,
                where: {
                    idTipoReporteVinculado: {
                        [Op.or]: [
                            tipoReporteEntrada.id,
                            tipoReporteEntradaRetraso.id
                        ]
                    }
                },
                include: [{
                    model: TiposReportes
                }]
            }]
        });

        // Consultamos el reporte de salida.
        const reporteSalida = await ReportesChequeos.findOne({
            where: {
                idEmpleadoVinculado: registroEmpleado.id,
                fechaRegistroReporteChequeo: {
                    [Op.between]: rangoReporte
                }
            },
            include: [{
                required: true,
                model: Reportes,
                where: {
                    idTipoReporteVinculado: {
                        [Op.or]: [
                            tipoReporteSalida.id,
                            tipoReporteSalidaExtras.id
                        ]
                    }
                },
                include: [{
                    model: TiposReportes
                }]
            }]
        });

        // Calculamos los tiempos y los agregamos al reporte.
        reporteEmpleado.push(
            calcularTiemposReporte(
                rangoDia(dia, semanaReporte, false)[0],
                reporteEntrada,
                reporteSalida,
                registroDiaLaboral
            )
        );
    }

    // Retornamos el reporte del empleado para toda la semana.
    return {
        nombreCompletoEmpleado: nombreCompletoEmpleado,
        reporteEmpelado: reporteEmpleado,
        reporteAccesos: reporteAccesos
    };
};

// Genera un reporte de el total de horas trabajadas por empleado
// dado una semana.
module.exports = async function resumenHorasTrabajadasEmpleados(
    request,
    respuesta
) {
    // GET Request.
    const cabecera = request.headers;
    const cuerpo = request.body;
    const parametros = request.params;
    const consulta = request.query;

    try {
        /* DESEMPAQUETAMOS LOS DATOS DE LA CONSULTA. */

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

        // Construimos la consulta hacia la db.
        const datos = Object();

        // Instanciamos la fecha de hoy.
        const fecha = new Date();

        // Instanciamos la semana del reporte.
        const semanaReporte = consulta.semanaReporte?
            deserealizarSemana(consulta.semanaReporte) : null;

        // Instancia del reporte generado.
        const reporte = [];

        /**
         * CONSULTAMOS Y VERIFICAMOS LA EXISTENCIA DE
         * LOS REGISTROS VINCULADOS.
         */

        // Buscamos el tipo de reporte para entrada.
        const tipoReporteEntrada = await TiposReportes.findOne({
            where: {
                tagTipoReporte: 'chequeoEntrada'
            }
        });

        // Buscamos el tipo de reporte para entrada con retraso.
        const tipoReporteEntradaRetraso = await TiposReportes.findOne({
            where: {
                tagTipoReporte: 'chequeoEntradaRetraso'
            }
        });

        // Buscamos el tipo de reporte para salida.
        const tipoReporteSalida = await TiposReportes.findOne({
            where: {
                tagTipoReporte: 'chequeoSalida'
            }
        });

        // Buscamos el tipo de reporte para salida con horas extra.
        const tipoReporteSalidaExtras = await TiposReportes.findOne({
            where: {
                tagTipoReporte: 'chequeoSalidaExtras'
            }
        });

        // Buscamos el tipo de reporte para acceso a zona.
        const tipoReporteAccesoZona = await TiposReportes.findOne({
            where: {
                tagTipoReporte: 'accesoGarantizado'
            }
        });

        // Buscamos el tipo de reporte para acceso a zona.
        const tipoReporteSalidaZona = await TiposReportes.findOne({
            where: {
                tagTipoReporte: 'salidaZona'
            }
        });

        // Si alguno de los registros no existe.
        if(!tipoReporteEntrada
            || !tipoReporteEntradaRetraso
            || !tipoReporteSalida
            || !tipoReporteSalidaExtras
            || !tipoReporteAccesoZona
            || !tipoReporteSalidaZona
        ) {
            // Retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Consultamos los registros de los empleados.
        const empleados = await Empleados.findAll({
            include: [{
                required: true,
                model: Horarios
            }]
        });

        /**
         * GENERAMOS LOS DATOS DEL REPORTE.
         */

        // Pool de promesas.
        const promesas = [];

        // Por cada empleado registrado en la base de datos.
        for (let i = 0; i < empleados.length; i++) {
            // Instanciamos un objeto empleado.
            const empleado = empleados[i];

            // Agrega la promesa al pool.
            promesas.push(Promise.resolve(generarReporteEmpleado(
                empleado,
                semanaReporte,
                tipoReporteEntrada,
                tipoReporteEntradaRetraso,
                tipoReporteSalida,
                tipoReporteSalidaExtras,
                tipoReporteAccesoZona,
                tipoReporteSalidaZona
            )));

        }

        // Resolvemos todas las promesas del pool.
        await Promise.all(promesas).then((respuestas) => {
            for(let i = 0; i < respuestas.length; i ++) {
                // Desempaquetamos el reporte.
                const respuesta = respuestas[i];

                // Guardamos los datos del reprote.
                reporte.push(respuesta);
            }
        });

        /**
         * RETORNAMOS EL REPORTE AL CLIENTE.
         */

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
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
