// Modelos de la DB
const db = require("../../models/index");

// Codigos de la API.
const respuestas = require("../../utils/codigosAPI");

// Instanciamos los codigos.
const CODIGOS = new respuestas.CodigoApp();

// Funcion para verificar que el registro exista en la DB.
const {
    existeRegistro
} = require("../../utils/registros");

// Manipulacion de ficheros y directorios.
const fs = require("fs");

// Para la creacion y lectura de tokens.
const {
    getTokenPayload
} = require("../../utils/jwtConfig");

// Funciones extra.
const {
    mostrarLog
} = require("../../utils/logs");

// Modelos que usara el controlador.
const Roles = db.rol;
const Recursos = db.recurso;
const Empleados = db.empleado;

// Modifica un registro de la base de datos.
module.exports = async function modificarEmpleado(
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
        const nombres = cuerpo.nombres;
        const apellidoPaterno = cuerpo.apellidoPaterno;
        const apellidoMaterno = cuerpo.apellidoMaterno;
        const numeroTelefonico = cuerpo.numeroTelefonico;
        const fechaNacimiento = cuerpo.fechaNacimiento;
        const idRolVinculado = cuerpo.idRolVinculado;
        const archivoImagen = request.file;

        // Verificamos que exista un id del registro a modificar.
        if(!id) {
            // Si no, retornamos un mensaje de error.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.DATOS_BUSQUEDA_INCOMPLETOS
            });
        }

        // Buscamos el registro.
        const registro = await Empleados.findByPk(id);

        // Verificamos que exista el registro.
        if(!registro) {
            // Si no se encontro el registro, se envia un
            // codio de registro inexistente.
            return respuesta.status(200).send({
                codigoRespuesta: CODIGOS.EMPLEADO_NO_ENCONTRADO,
            });
        }

        // Cambiamos los datos del registro.
        if(nombres) {
            registro.nombres = nombres;
        }
        if(apellidoMaterno) {
            registro.apellidoMaterno = apellidoMaterno;
        }
        if(apellidoPaterno) {
            registro.apellidoPaterno = apellidoPaterno;
        }
        if(numeroTelefonico) {
            registro.numeroTelefonico = numeroTelefonico;
        }
        if(fechaNacimiento) {
            registro.fechaNacimiento = new Date(fechaNacimiento);
        }
        if(idRolVinculado) {
            // Verificamos que los registros vinculados existan.
            if(! await existeRegistro(Roles, idRolVinculado)) {
                // Retornamos un mensaje de error.
                return respuesta.status(200).send({
                    codigoRespuesta: CODIGOS.REGISTRO_VINCULADO_NO_EXISTE
                });
            }
            registro.idRolVinculado = idRolVinculado;
        }
        if(archivoImagen) {
            // Creamos el registro de la imagen del empleado.
            const nuevaImagen = {
                tipo: archivoImagen.mimetype,
                nombre: archivoImagen.filename,
                data: fs.readFileSync(archivoImagen.path),
                fechaRegistroRecurso: fecha,
            };

            // Guardamos el registro en la DB.
            await Recursos.create(nuevaImagen).then((registro) => {
                registro.idImagenVinculada = registro.id;
            });
        }

        // Actualizamos la fehca de modificacion del empleado.
        registro.fechaModificacionEmpleado = fecha;

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