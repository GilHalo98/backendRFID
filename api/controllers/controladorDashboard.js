// Modelos de la DB
const db = require("../models/index");

// Codigos de la API.
const respuestas = require("../utils/codigosAPI");

// Instanciamos los codigos.
const CODIGOS = new respuestas.CodigoApp();

// Operadores de sequelize para consultas
const { Op } = require("sequelize");

// Para la creacion y lectura de tokens.
const { getToken, getTokenPayload } = require("../utils/jwtConfig");

// Funciones extra.
const { rangoHoy } = require("../utils/tiempo");
const { existeRegistro } = require("../utils/registros");

// Modelos que usara el controlador.
const ReportesActividades = db.reporteActividad;
const TiposDispositivos = db.tipoDispositivo;
const DispositivosIoT = db.dispositivoIoT;
const ReportesAccesos = db.reporteAcceso;
const TiposReportes = db.tipoReporte;
const Empleados = db.empleado;
const Reportes = db.reporte;
const Zonas = db.zona;
const Roles = db.rol;

// Genera un reporte de accesos al día.
exports.accesosPorDia = async(request, respuesta) => {
    // GET Request.
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

        // Verificamos si se selecciono un offset.
        const offset = (
            !consulta.offset ? consulta.offset : parseInt(consulta.offset)
        );

        // Verificamos si se selecciono un maximo de elementos por pagina.
        const limit = (
            !consulta.limit ? consulta.limit : parseInt(consulta.limit)
        );

        // Consultamos el total de los registros.
        const totalRegistros = await ReportesAccesos.count({
            where: {
                fechaRegistroReporteAcceso: { 
                    [Op.between]: rangoHoy(),
                }
            },
        });

        // Consultamos los registros de los reportes de accesos,
        // los ordenamos de manera ascendente y unicamente buscamos los
        // que se encuentren en la fecha del dia actual.
        const registros = await ReportesAccesos.findAll({
            offset: offset,
            limit: limit,
            where: {
                fechaRegistroReporteAcceso: { 
                    [Op.between]: rangoHoy(),
                }
            },
            include: [{
                model: Empleados,
                include: [{
                    model: Roles
                }]
            }, {
                model: Reportes,
                include: [{
                    model: TiposReportes
                }]
            }, {
                model: Zonas
            }],
            order: [['fechaRegistroReporteAcceso', 'ASC']],
        });

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            registros: registros,
            totalRegistros: totalRegistros
        });

    } catch(excepcion) {
        // Mostramos el error en la consola
        console.log(excepcion);

        // Retornamos un codigo de error.
        return respuesta.status(500).send({
            codigoRespuesta: CODIGOS.API_ERROR,
        });
    }
};

// Genera un reporte de la actividad de una maquina.
exports.actividadDeMaquina = async(request, respuesta) => {
    // GET Request.
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

        // Recuperamos los datos de la busqueda.
        const idDispositivoVinculado = cuerpo.idDispositivoVinculado;

        // Verificamos que existan datos suficientes para realizar la consulta.
        if(!idDispositivoVinculado) {
            // Si no estan completos mandamos
            // un mensaje de datos incompletos.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_BUSQUEDA_INCOMPLETOS
            });
        }

        if(! await existeRegistro(DispositivosIoT, idDispositivoVinculado)) {
            // Retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Verificamos si se selecciono un offset.
        const offset = (
            !consulta.offset ? consulta.offset : parseInt(consulta.offset)
        );

        // Verificamos si se selecciono un maximo de elementos por pagina.
        const limit = (
            !consulta.limit ? consulta.limit : parseInt(consulta.limit)
        );

        // Consultamos el total de los registros.
        const totalRegistros = await ReportesActividades.count({
            where: {
                fechaRegistroReporteActividad: { 
                    [Op.between]: rangoHoy(),
                }
            },
        });

        // Consultamos los registros de los reportes de accesos,
        // los ordenamos de manera ascendente y unicamente buscamos los
        // que se encuentren en la fecha del dia actual.
        const registros = await ReportesActividades.findAll({
            offset: offset,
            limit: limit,
            where: {
                fechaRegistroReporteActividad: { 
                    [Op.between]: rangoHoy(),
                },
                idDispositivoVinculado: idDispositivoVinculado
            },
            include: [{
                model: Empleados
            }, {
                required: true,
                model: Reportes,
                include: [{
                    model: TiposReportes,
                    where: {
                        id: {
                            [Op.or]: [12, 13]
                        }
                    }
                }]
            }],
            order: [['fechaRegistroReporteActividad', 'DESC']],
        });

        // Tiempo total de actividad en milisegundos.
        let tiempoActividadTotal = 0;

        // Tiempo total de inactividad en milisegundos.
        let tiempoInactivoTotal = 0;

        // Fecha de finalizacion del periodo anterior.
        let periodoAnterior = undefined;

        // Nos movemos desde el ultimo elemento de la
        // lista, hasta el primero
        let index = registros.length - 1;
        while (index > 1) {
            // Recuperamos el elemento en n y n - 1;
            const registro = registros[index];
            const registroSiguiente = registros[index - 1];

            // Si los reportes estan echos por el mismo empleado y el
            // reporte en n es de tipo inicio de actividad, mientras
            // que el de n - 1 es de finalizacion de activdad.
            if(
                registro.idEmpleadoVinculado == registroSiguiente.idEmpleadoVinculado
            ) {
                if(typeof periodoAnterior !== 'undefined') {
                    // Calculamos el tiempo de inactividad.
                    tiempoInactivoTotal += registro.fechaRegistroReporteActividad
                    - periodoAnterior.fechaRegistroReporteActividad;
                }

                // Eso quiere decir que es un periodo de actividad,
                // calculamos el tiempo de actividad por periodo, este
                // tiempo esta en milisegundos.
                tiempoActividadTotal += registroSiguiente.fechaRegistroReporteActividad
                - registro.fechaRegistroReporteActividad;

                // Actualizamos el fin el periodo anterior.
                periodoAnterior = registroSiguiente;

                // Nos movemos al siguiente periodo.
                index -= 2;

            } else {
                // Si no es asi, eso quiere decir eque el periodo esta
                // mal formado, saltamos el reporte actual al siguiente.
                index -= 1;
            }

        }

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            totalRegistros: totalRegistros,
            tiempoActividadTotal: tiempoActividadTotal,
            tiempoInactivoTotal: tiempoInactivoTotal,
            registros: registros
        });

    } catch(excepcion) {
        // Mostramos el error en la consola
        console.log(excepcion);

        // Retornamos un codigo de error.
        return respuesta.status(500).send({
            codigoRespuesta: CODIGOS.API_ERROR,
        });
    }
};