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

// Genera un historial de actividad de una maquinada dada.
module.exports = async function reporteActividadMaquina(
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
        const payload = await getTokenPayload(cabecera.authorization);

        // Verificamos que el payload sea valido.
        if(!payload) {
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.TOKEN_INVALIDO
            });
        }

        // Construimos la consulta hacia la db.
        const datos = Object();

        // Agregamos los parametros de la consulta.
        if(consulta.idDispositivoVinculado) {
           datos.idDispositivoVinculado = consulta.idDispositivoVinculado; 
        }

        if(consulta.descripcionDispositivo) {
            datos.descripcionDispositivo = {
                [Op.like]: consulta.descripcionDispositivo
            };
        }

        // Instanciamos la semana del reporte.
        const semanaReporte = consulta.semanaReporte?
            deserealizarSemana(consulta.semanaReporte) : null;

        // Inicializamos el rango de la semana a generar el reporte.
        if(semanaReporte) {
            datos.fechaRegistroReporteActividad = {
                [Op.between]: semanaReporte
            }
        }

        // Verificamos que exista el registro vinculado.
        const existeRegistroDispositivo =  await existeRegistro(
            DispositivosIoT,
            consulta.idDispositivoVinculado
        );

        // Verificamos los datos del registro.
        if(!existeRegistroDispositivo)  {
            // Retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
            });
        }

        // Consultamos todos los registros de reportes de actividad del
        // dispositivo.
        const registros = await ReportesActividades.findAll({
            where: datos,
            include: [{
                model: Reportes,
                include: [{
                    model: TiposReportes
                }]
            }, {
                model: Empleados
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
        while (index >= 1) {
            // Recuperamos el elemento en n y n - 1;
            const registro = registros[index];
            const registroSiguiente = registros[index - 1];

            const idEmpleado = registro.idEmpleadoVinculado;
            const idEmpleadoSiguiente = registroSiguiente.idEmpleadoVinculado;

            // Si los reportes estan echos por el mismo empleado y el
            // reporte en n es de tipo inicio de actividad, mientras
            // que el de n - 1 es de finalizacion de activdad.
            if(idEmpleado == idEmpleadoSiguiente) {
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
            tiempoActividadTotal: tiempoActividadTotal,
            tiempoInactivoTotal: tiempoInactivoTotal
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