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

// Modelos que usara el controlador.
const Reportes = db.reporte;
const TiposReportes = db.tipoReporte;
const Empleados = db.empleado;

// Consulta los registros en la base de datos.
exports.registrosRecientes = async(request, respuesta) => {
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

        // Construimos la consulta hacia la db.
        const datos = Object();

        // Agregamos los parametros de la consulta.
        if(consulta.id) {
            datos.id = consulta.id;
        }

        if(consulta.descripcionReporte) {
            datos.descripcionReporte = {
                [Op.substring]: consulta.descripcionReporte
            };
        }
        
        // Consultamos los reportes que son de acceso garantizado o negado.
        datos.idTipoReporteVinculado = [2, 3];

        // Consultamos el total de los registros.
        const totalRegistros = await Reportes.count({
            where: datos,
        });

        // Consultamos todos los registros.
        const registros = await Reportes.findAll({
            order: [
                ["fechaRegistroReporte", 'DESC']
            ],
            offset: offset,
            limit: limit,
            where: datos,
            include: [{
                model: Empleados,
            },
            {
                model: TiposReportes
            }]
        });

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            totalRegistros: totalRegistros,
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

        // Instanciamos el rango de fechas de hoy.
        const hoy = new Date().setHours(0, 0, 0, 0)
        const fecha = new Date();

        // Realizamos un conteo de los registros de accesos.
        const accesosGarantizados = await Reportes.count({
            where: {
                idTipoReporteVinculado: 2,
                fechaRegistroReporte: { 
                    [Op.gt]: hoy,
                }
            }
        });

        const accesosNegados = await Reportes.count({
            where: {
                idTipoReporteVinculado: 3,
                fechaRegistroReporte: { 
                    [Op.gt]: hoy,
                }
            }
        });

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            accesosGarantizados,
            accesosNegados
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

// Genera un reporte por tipo.
exports.reportePorTipo = async(request, respuesta) => {
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

        // Instanciamos el rango de fechas de hoy.
        const hoy = new Date().setHours(0, 0, 0, 0)
        const fecha = new Date();

        // Obtenemos los id de los tipos de reportes.
        const tiposReportes = await TiposReportes.findAll({
            attributes: ['id', 'clasificacionReporte']
        });

        const conteos = {};

        for (let i = 0; i < tiposReportes.length; i++) {
            const tipoReporte = tiposReportes[i];
            conteos[tipoReporte.clasificacionReporte] = await Reportes.count({
                where: {
                    idTipoReporteVinculado: tipoReporte.id,
                    fechaRegistroReporte: { 
                        [Op.gt]: hoy,
                    }
                }
            });
        }

        // Retornamos los registros encontrados.
        return respuesta.status(200).send({
            codigoRespuesta: CODIGOS.OK,
            conteos
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
