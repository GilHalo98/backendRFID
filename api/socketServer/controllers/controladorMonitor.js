// Modelos de la DB
const db = require("../../models/index");

// Funcion para verificar que el registro exista en la DB.
const { existeRegistro } = require("../../utils/registros");

// Status de los dispositivos conectados.
const Estatus = require("../../utils/statusDispositivos");
const ESTATUS_DISPOSITIVOS = new Estatus.estatusDispositivos();

// Funcion de logs del servidor.
const {
    mostrarLog
} = require('../../utils/logs');

// Eventos del server socket.
const Eventos = require("../../utils/EventosSocket");
const EVENTOS = new Eventos.EventosSockets();

// Modelos a usar de la db.
const DispositivosIoT = db.dispositivoIoT;
const TiposDispositivos = db.tipoDispositivo;
const Zonas = db.zona;

// Consulta los registros en la base de datos.
exports.listarDispositivos = async (io, socket, payload, DISPOSITIVOS) => {
    const consulta = !payload ? {} : payload;

    try {
        mostrarLog('listando dispositivos');

        // Lista de dispositivos.
        const lista = [];

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

        if(consulta.idZonaVinculada) {
            // Buscamos en la db el registro vinculado.
            const zonaVinculada = await Zonas.findByPk(
                consulta.idZonaVinculada
            );

            // Si no existe.
            if(!zonaVinculada) {
                // Retornamos un mensaje de error.
            }

            // Si existe, se agrega el dato a la busqueda.
            datos.idZonaVinculada = consulta.idZonaVinculada;
        }

        if(consulta.idTipoDispositivoVinculado) {
            // Si no existe.
            if(! await existeRegistro(
                TiposDispositivos,
                consulta.idTipoDispositivoVinculado
            )) {
                // Retornamos un mensaje de error.
            }

            // Si existe, se agrega el dato a la busqueda.
            datos.idTipoDispositivoVinculado = consulta.idTipoDispositivoVinculado;
        }

        // Agregarle paginacion para no consultar todos los
        // dispositivos registrados.
        const registros = await DispositivosIoT.findAll({
            offset: offset,
            limit: limit,
            include: [{
                model: Zonas,
            }, {
                model: TiposDispositivos,
            }]
        });

        registros.map((registro) => {
            let status = ESTATUS_DISPOSITIVOS.DESCONECTADO;

            if(DISPOSITIVOS[registro.id]) {
                status = DISPOSITIVOS[registro.id].status;
            }

            lista.push({
                id: registro.id,
                status: status,
                zona: registro.zona.nombreZona,
                idZona: registro.idZonaVinculada,
                idTipoDispositivo: registro.idTipoDispositivoVinculado,
                descripcionDispositivo: registro.descripcionDispositivo,
                bitZona: registro.zona.bitZona,
                tipoDispositivo: registro.tipoDispositivo.nombreTipoDispositivo
            });
        });

        io.to(socket.id).emit(EVENTOS.LISTA_CLIENTES, lista);

    } catch(excepcion) {
        // Mostramos el error en la consola
        mostrarLog(
            `Error al listar dispositivos: ${excepcion}`
        );
    }
};

// Forza una accion sobre un cliente.
exports.forzarEvento = async (io, socket, payload, CLIENTES) => {
    const consulta = !payload ? {} : payload;

    try {
        const accion = consulta.accion;
        const idDispositivo = consulta.idDispositivo;
        const argumentos = consulta.argumentos;

        if(!accion || !idDispositivo) {
            // Retornamos un mensaje de
            // parametros necesarios incompletos.
        }

        let uidObjetivo;

        for(let uuid_cliente_en_lista in CLIENTES) {                
            // si ya existe, entonces solo actualizamos el uuid.
            if(idDispositivo == CLIENTES[uuid_cliente_en_lista]) {
                uidObjetivo = uuid_cliente_en_lista;
            }
        }

        if(!uidObjetivo) {
            // Retornamos un mensaje de dispositivo no
            // conectado o invalido.
        }

        mostrarLog(
            socket.id
            + ' a forzado la accion '
            + accion
            + ' sobre el dispositivo '
            + idDispositivo
        );

        // Emitimos el evento de accion forzada
        // al cliente objetivo.
        socket.broadcast.to(
            uidObjetivo
        ).emit(accion, argumentos);

    } catch(excepcion) {
        // Mostramos el error en la consola
        mostrarLog(
            `Error al forzar evento en dispositivo: ${excepcion}`
        );
    }
};

// Consulta el estatus de un dispositivo.
exports.consultarEstatus = async (io, socket, payload, DISPOSITIVOS) => {
    const consulta = !payload ? {} : payload;

    try {
        mostrarLog('Reportado status de dispositivo');

        io.to(socket.id).emit(
            EVENTOS.ESTATUS_DISPOSITIVO,
            DISPOSITIVOS[consulta].status
        );

    } catch(excepcion) {
        // Mostramos el error en la consola
        mostrarLog(
            `Error al consultar estatus de dispositivo: ${excepcion}`
        );
    }
};