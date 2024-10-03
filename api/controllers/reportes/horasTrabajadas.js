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
    rangoDia,
    dateDiaSemana,
    deserealizarSemana,
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
const Roles = db.rol;
const Reportes = db.reporte;
const Horarios = db.horario;
const Empleados = db.empleado;
const TiposReportes = db.tipoReporte;
const DiasLaborales = db.diaLaboral;
const ReportesChequeos = db.reporteChequeo;

// Genera los reportes por dia laboral.
function generarReportePorDia(
    registroDiaLaboral,
    reporteEntrada,
    reporteSalida,
    tipoReporteEntradaRetraso,
    tipoReporteSalidaExtras,
    fechaDia,
    hoy
) {
    // Para realizar el calculo de las horas
    // trabajadas y descansadas.
    let tiempoTrabajo = 0;

    // Identificamos si falto.
    let falto = false;

    // Identificamos si llego tarde.
    let llegoTarde = false;

    // Identificamos si salio tarde.
    let salioTarde = false;

    // Identificamos si el dia es mayor que el dia actual.
    let diaFueraDeRango = false;

    // Construimos los datos a detalle del reporte.
    const datosDetalle = {
        entrada: undefined,
        salida: undefined
    };

    console.log(`${fechaDia} > ${hoy} = ${fechaDia > hoy}`);

    // Si la fecha del dia es mayor que el dia actual, entonces el dia
    //  del reporte es invalido.
    if(fechaDia > hoy) {
        // Indica si el dia es mayor que el dia actual.
        diaFueraDeRango = true;

    } else {
        // Si existen el reporte de entrada y salida.
        if(!(!reporteSalida || !reporteEntrada)) {
            // Calculamos el tiempo de trabajo en milisegundos.
            tiempoTrabajo = reporteSalida.fechaRegistroReporteChequeo
                - reporteEntrada.fechaRegistroReporteChequeo;

            llegoTarde = reporteEntrada.reporte.idTipoReporteVinculado == tipoReporteEntradaRetraso.id?
                true : false;

            salioTarde = reporteSalida.reporte.idTipoReporteVinculado == tipoReporteSalidaExtras.id?
                true : false;

        }

        if(!reporteEntrada && !reporteSalida) {
            // Y no es un descanso.
            if(!registroDiaLaboral.esDescanso) {
                // Si el dia del reporte es mayor que el dia actual.
                // no se marca como falta.
                if(fechaDia < hoy) {
                    // De lo contrario, se marca una falta.
                    falto = true;
                }
            }
        }

        // Construimos los datos a detalle del reporte.
        datosDetalle.entrada = !reporteEntrada?
            null : reporteEntrada.fechaRegistroReporteChequeo;

        datosDetalle.salida = !reporteSalida?
            null : reporteSalida.fechaRegistroReporteChequeo;
    }

    // Guardamos la informacion en el diccionario.
    return {
        dia: registroDiaLaboral.dia,
        detalle: datosDetalle,
        tiempoTrabajo: tiempoTrabajo,
        llegoTarde: llegoTarde,
        salioTarde: salioTarde,
        esDescanso: registroDiaLaboral.esDescanso,
        falto: falto,
        diaFueraDeRango: diaFueraDeRango
    };
};

// Genera los reportes por empleado.
async function generarReporte(
    registroEmpleado,
    semanaReporte,
    tipoReporteEntrada,
    tipoReporteEntradaRetraso,
    tipoReporteSalida,
    tipoReporteSalidaExtras,
    hoy
) {
    // Horas trabajadas por dia.
    const horasTrabajadas = []

    // Registro del horario del empleado.
    const horario = registroEmpleado.horario;

    // Registros de dias laborales del horario.
    const diasLaborales = horario.diaLaborals;

    // Tiempo total de trabajo en milisegundos.
    let tiempoTrabajoTotal = 0;

    // Si el registroEmpleado del empleado tiene horario.
    if(!horario) {
        // Guardamos los datos a enviar
        return {
            id: registroEmpleado.id,
            nombres: registroEmpleado.nombres,
            apellidoPaterno: registroEmpleado.apellidoPaterno,
            apellidoMaterno: registroEmpleado.apellidoMaterno,
            idImagenVinculada: registroEmpleado.idImagenVinculada,
            idRolVinculado: registroEmpleado.idRolVinculado,
            tiempoTrabajoTotal: tiempoTrabajoTotal,
            horasTrabajadas: null
        };
    }

    // Si el registroEmpleado del empelado no tiene dias laborales.
    if(!diasLaborales) {
        // Guardamos los datos a enviar
        return {
            id: registroEmpleado.id,
            nombres: registroEmpleado.nombres,
            apellidoPaterno: registroEmpleado.apellidoPaterno,
            apellidoMaterno: registroEmpleado.apellidoMaterno,
            idImagenVinculada: registroEmpleado.idImagenVinculada,
            idRolVinculado: registroEmpleado.idRolVinculado,
            tiempoTrabajoTotal: tiempoTrabajoTotal,
            horasTrabajadas: null
        };
    }

    /**
     * Se realiza el reporte de las horas trabajadas.
    */

    // Por cada dia laboral en el horario.
    for(let j = 0; j < diasLaborales.length; j++) {
        // Desempaquetamos el registro del dia laboral.
        const registroDiaLaboral = diasLaborales[j];

        // Fecha del dia del reporte
        const fechaDia = dateDiaSemana(
            registroDiaLaboral.dia,
            semanaReporte,
            true
        );

        // Calculamos el rango del dia para el reporte.
        const rangoDiaReporte = rangoDia(
            registroDiaLaboral.dia,
            semanaReporte
        );

        // Consultamos los reportes de chequeos.
        const reporteEntrada = await ReportesChequeos.findOne({
            where: {
                idEmpleadoVinculado: registroEmpleado.id,
                fechaRegistroReporteChequeo: {
                    [Op.between]: rangoDiaReporte,
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

        // Consultamos los reportes de salida.
        const reporteSalida = await ReportesChequeos.findOne({
            where: {
                idEmpleadoVinculado: registroEmpleado.id,
                fechaRegistroReporteChequeo: {
                    [Op.between]: rangoDiaReporte,
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

        // Agregamos la promesa al Pool de promesas.
        const reporteDia = generarReportePorDia(
            registroDiaLaboral,
            reporteEntrada,
            reporteSalida,
            tipoReporteEntradaRetraso,
            tipoReporteSalidaExtras,
            fechaDia,
            hoy
        );

        // Acumulamos el tiempo de trabajo total.
        horasTrabajadas.push(reporteDia);

        // Acumulamos el tiempo de trabajo total.
        tiempoTrabajoTotal += reporteDia.tiempoTrabajo;
    }

    return {
        id: registroEmpleado.id,
        nombres: registroEmpleado.nombres,
        apellidoPaterno: registroEmpleado.apellidoPaterno,
        apellidoMaterno: registroEmpleado.apellidoMaterno,
        idImagenVinculada: registroEmpleado.idImagenVinculada,
        idRolVinculado: registroEmpleado.idRolVinculado,
        tiempoTrabajoTotal: tiempoTrabajoTotal,
        horasTrabajadas: horasTrabajadas
    };
};

// Genera un reporte de horas trabajadas en el
// periodo de tiempo dado.
module.exports = async function reporteHorasTrabajadas(
    request,
    respuesta
) {
    // GET Request.
    const cabecera = request.headers;
    const cuerpo = request.body;
    const parametros = request.params;
    const consulta = request.query;

    try {
        /**
         * Verificamos el token del header.
        */

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

        /**
         * Desempaquetamos los datos del request.
        */

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

        // Instanciamos la fecha de hoy.
        const hoy = new Date();

        // Agregamos los parametros de la consulta.
        if(consulta.idEmpleadoVinculado) {
            datos.id = consulta.idEmpleadoVinculado; 
         }
 
         if(consulta.nombres) {
             datos.nombres = {
                 [Op.substring]: consulta.nombres
             };
         }
 
         // Si existe el parametro de busqueda de rol vinculado.
         if(consulta.idRolVinculado) {
             // Buscamos por el registroEmpleado de roles.
             const existeRegistroRoles = await existeRegistro(
                 Roles,
                 consulta.idRolVinculado
             );
 
             // Si no existe.
             if(!existeRegistroRoles) {
                 // Retornamos un mensaje de error.
                 return respuesta.status(200).send({
                     codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                 });
             }
 
             // Si existe, se agrega el dato a la busqueda.
             datos.idRolVinculado = consulta.idRolVinculado;
         }

        // Instanciamos la semana del reporte.
        const semanaReporte = consulta.semanaReporte?
            deserealizarSemana(consulta.semanaReporte) : null;

        /**
         * Consultamos los datos vinculados.
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

        // Si alguno de los registros no existe.
        if(!tipoReporteEntrada
            || !tipoReporteEntradaRetraso
            || !tipoReporteSalida
            || !tipoReporteSalidaExtras
        ) {
            // Retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        /**
         * Generamos el reporte.
        */

        // Consultamos el total de los registros.
        const totalRegistros = await Empleados.count({
            where: datos
        });

        // Consultamos todos los registros.
        const registrosEmpleados = await Empleados.findAll({
            offset: offset,
            limit: limit,
            where: datos,
            include: [{
                model: Horarios,
                include: [{
                    model: DiasLaborales
                }]
            }]
        });

        // Lista de datos por empelado.
        const promesas = [];

        // Inicializamos la lista de datos por empelado.
        for(let i  = 0; i < registrosEmpleados.length; i ++) {
            // Desempaquetamos el registro del empleado.
            const registroEmpleado = registrosEmpleados[i];

            // Agregamos la promesa al Pool de promesas.
            promesas.push(Promise.resolve(generarReporte(
                registroEmpleado,
                semanaReporte,
                tipoReporteEntrada,
                tipoReporteEntradaRetraso,
                tipoReporteSalida,
                tipoReporteSalidaExtras,
                hoy
            )));
        }

        // Reporte de horas trabajadas por empleado.
        let datosPorEmpleado = [];

        // Resolvemos las promesas en el pool.
        await Promise.all(promesas).then((respuestas) => {
            datosPorEmpleado = respuestas;
        });

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            totalRegistros: totalRegistros,
            datosPorEmpleado: datosPorEmpleado
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