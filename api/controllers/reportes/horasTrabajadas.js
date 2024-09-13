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
const Roles = db.rol;
const Reportes = db.reporte;
const Horarios = db.horario;
const Empleados = db.empleado;
const TiposReportes = db.tipoReporte;
const DiasLaborales = db.diaLaboral;
const ReportesChequeos = db.reporteChequeo;

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
         * Procesamos el token.
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
         * Desempaquetamos los datos de la consulta.
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
            // Buscamos por el registro de roles.
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

        // Inicializamos el rango de la semana a generar el reporte.
        const semanaReporte = consulta.semanaReporte?
            deserealizarSemana(consulta.semanaReporte) : null;

        /**
         * Consultamos el total de registros y los registros.
         */

        // Consultamos el total de los registros.
        const totalRegistros = await Empleados.count({
            where: datos
        });

        // Consultamos todos los registros.
        const registros = await Empleados.findAll({
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

        // Buscamos el tipo de reporte para el inicio de descanso.
        const tipoReporteInicioDescanso = await TiposReportes.findOne({
            where: {
                tagTipoReporte: 'chequeoInicioDescanso'
            }
        });

        // Buscamos el tipo de reporte para el fin de descanso.
        const tipoReporteFinDescanso = await TiposReportes.findOne({
            where: {
                tagTipoReporte: 'chequeoFinDescanso'
            }
        });

        // Si alguno de los registros no existe.
        if(
            !tipoReporteEntrada
            || !tipoReporteEntradaRetraso
            || !tipoReporteSalida
            || !tipoReporteSalidaExtras
            || !tipoReporteInicioDescanso
            || !tipoReporteFinDescanso
        ) {
            // Retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        /**
         * Generamos el reporte.
         */

        // Lista de datos por empleado.
        const datosPorEmpleado = [];

        // Por cada registro en los registros de los empleados.
        for(let i = 0; i < registros.length; i++) {
            // Registro de empleado.
            const registro = registros[i];

            // Tiempo total de trabajo en milisegundos.
            let tiempoTrabajoTotal = 0;

            // Lista de horas trabajadas por dia.
            const datosPorDia = [];

            // Registro de horario del empleado.
            const horario = registro.horario;

            // Si el registro del empelado no tiene horario.
            if(!horario) {
                // Guardamos los datos a enviar
                datosPorEmpleado.push({
                    id: registro.id,
                    nombres: registro.nombres,
                    apellidoPaterno: registro.apellidoPaterno,
                    apellidoMaterno: registro.apellidoMaterno,
                    idImagenVinculada: registro.idImagenVinculada,
                    idRolVinculado: registro.idRolVinculado,
                    tiempoTrabajoTotal: tiempoTrabajoTotal,
                    horasTrabajadas: null
                });

                // Se retorna un nulo.
                continue;
            }

            // Registros de dias laborales del horario.
            const diasLaborales = horario.diaLaborals;

            // Si el registro del empelado no tiene dias laborales.
            if(!diasLaborales) {
                // Guardamos los datos a enviar
                datosPorEmpleado.push({
                    id: registro.id,
                    nombres: registro.nombres,
                    apellidoPaterno: registro.apellidoPaterno,
                    apellidoMaterno: registro.apellidoMaterno,
                    idImagenVinculada: registro.idImagenVinculada,
                    idRolVinculado: registro.idRolVinculado,
                    tiempoTrabajoTotal: tiempoTrabajoTotal,
                    horasTrabajadas: null
                });

                // Se retorna un nulo.
                continue;
            }

            /**
             * Se realiza el reporte de las horas trabajadas.
             */

            // Por cada dia laboral en el horario.
            for(let j = 0; j < diasLaborales.length; j++) {
                // Registro de dia laboral.
                const diaLaboral = diasLaborales[j];

                // Calculamos el rango del dia para el reporte.
                const rangoDiaReporte = rangoDia(
                    diaLaboral.dia,
                    semanaReporte
                );

                // Consultamos los reportes de chequeos.
                const reporteEntrada = await ReportesChequeos.findOne({
                    where: {
                        idEmpleadoVinculado: registro.id,
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

                // Consultamos los reportes de inicio de descanso.
                const reporteInicioDescanso = await ReportesChequeos.findOne({
                    where: {
                        idEmpleadoVinculado: registro.id,
                        fechaRegistroReporteChequeo: {
                            [Op.between]: rangoDiaReporte,
                        }
                    },
                    include: [{
                        required: true,
                        model: Reportes,
                        where: {
                            idTipoReporteVinculado: tipoReporteInicioDescanso.id
                        },
                        include: [{
                            model: TiposReportes
                        }]
                    }]
                });

                // Consultamos los reportes de fin de descanso.
                const reporteFinDescanso = await ReportesChequeos.findOne({
                    where: {
                        idEmpleadoVinculado: registro.id,
                        fechaRegistroReporteChequeo: {
                            [Op.between]: rangoDiaReporte,
                        }
                    },
                    include: [{
                        required: true,
                        model: Reportes,
                        where: {
                            idTipoReporteVinculado: tipoReporteFinDescanso.id
                        },
                        include: [{
                            model: TiposReportes
                        }]
                    }]
                });

                // Consultamos los reportes de salida.
                const reporteSalida = await ReportesChequeos.findOne({
                    where: {
                        idEmpleadoVinculado: registro.id,
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

                // Para realizar el calculo de las horas
                // trabajadas y descansadas.
                let tiempoTrabajo = 0;
                let tiempoDescanso = 0;

                // Identificamos si falto.
                let falto = false;

                // Identificamos si llego tarde.
                let llegoTarde = false;

                // Identificamos si salio tarde.
                let salioTarde = false;

                // Si existen el reporte de entrada y salida.
                if(!(!reporteSalida || !reporteEntrada)) {
                    // Calculamos el tiempo de trabajo en milisegundos.
                    tiempoTrabajo = reporteSalida.fechaRegistroReporteChequeo
                        - reporteEntrada.fechaRegistroReporteChequeo;

                    llegoTarde = reporteEntrada.reporte.idTipoReporteVinculado == tipoReporteEntradaRetraso.id?
                        true : false;

                    salioTarde = reporteSalida.reporte.idTipoReporteVinculado == tipoReporteSalidaExtras.id?
                        true : false;

                } else {
                    // Si existe el reporte de inicio y fin de descanso.
                    if(!(!reporteInicioDescanso || !reporteFinDescanso)) {
                        // Marcamos que el empleado no falto.
                        falto = false;

                    // Si ninguno de estos existe, entonces es una falta
                    } else {
                        falto = diaLaboral.esDescanso == 1?
                            false : true;
                    }
                }

                // Si existen el reporte de inicio y fin de descanso.
                if(!(!reporteInicioDescanso || !reporteFinDescanso)) {
                    // Calculamos el tiempo de descanso en milisegundos.
                    tiempoDescanso = reporteFinDescanso.fechaRegistroReporteChequeo
                        - reporteInicioDescanso.fechaRegistroReporteChequeo;
                }

                // Construimos los datos a detalle del reporte.
                const datosDetalle = {
                    entrada: !reporteEntrada?
                        null : reporteEntrada.fechaRegistroReporteChequeo,

                    inicioDescanso: !reporteInicioDescanso?
                        null : reporteInicioDescanso.fechaRegistroReporteChequeo,

                    finDescanso: !reporteFinDescanso?
                        null : reporteFinDescanso.fechaRegistroReporteChequeo,

                    salida: !reporteSalida?
                        null : reporteSalida.fechaRegistroReporteChequeo ,
                };

                // Guardamos la informacion en el diccionario.
                datosPorDia.push({
                    dia: diaLaboral.dia,
                    detalle: datosDetalle,
                    tiempoTrabajo: tiempoTrabajo - tiempoDescanso,
                    tiempoDescanso: tiempoDescanso,
                    llegoTarde: llegoTarde,
                    salioTarde: salioTarde,
                    esDescanso: diaLaboral.esDescanso,
                    falto: falto
                });

                // Acumulamos el tiempo de trabajo total
                tiempoTrabajoTotal += tiempoTrabajo - tiempoDescanso;
            }

            // Guardamos los datos a enviar
            datosPorEmpleado.push({
                id: registro.id,
                nombres: registro.nombres,
                apellidoPaterno: registro.apellidoPaterno,
                apellidoMaterno: registro.apellidoMaterno,
                idImagenVinculada: registro.idImagenVinculada,
                idRolVinculado: registro.idRolVinculado,
                tiempoTrabajoTotal: tiempoTrabajoTotal,
                horasTrabajadas: datosPorDia
            });
        }

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