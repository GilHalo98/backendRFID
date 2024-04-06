// Eventos del server socket.
const Eventos = require("../utils/EventosSocket");
const EVENTOS = new Eventos.EventosSockets();

// Controladores de los eventos.
const {
    reportarEstatus,
    peticionAcceso,
    peticionAccesoBloquear,
    peticionAccesoDesbloquear
} = require("./controllers/controladorDispositivo");

const {
    listarDispositivos,
    forzarEvento
} = require("./controllers/controladorMonitor");

const {
    conexion,
    desconexion
} = require("./controllers/controladorCliente");

// Diccionario de los dispositivos registrados en la DB.
const DISPOSITIVOS = {};

// Diccionario de clientes conectados al sokcet server.
const CLIENTES = {};

module.exports = async (io) => {
    console.log('Socket server activo');

    io.on(EVENTOS.CONEXION, async (socket) => {
        try {
            // Validamos el nuevo cliente.
            await conexion(io, socket, DISPOSITIVOS, CLIENTES);

            // Reportamos a los monitores la coneixon del cliente.
            io.to('monitores').emit(EVENTOS.CLIENTE_CONECTADO);

            socket.on(EVENTOS.REPORTAR_STATUS, async (payload) => {
                await reportarEstatus(io, socket, payload, DISPOSITIVOS, CLIENTES);
            });

            socket.on(EVENTOS.PETICION_ACCESO, async (payload) => {
                await peticionAcceso(io, socket, payload, DISPOSITIVOS, CLIENTES);
            });

            socket.on(EVENTOS.PETICION_ACCESO_BLOQUEAR, async (payload) => {
                await peticionAccesoBloquear(io, socket, payload, DISPOSITIVOS, CLIENTES);
            });

            socket.on(EVENTOS.PETICION_ACCESO_DESBLOQUEAR, async (payload) => {
                await peticionAccesoDesbloquear(io, socket, payload, DISPOSITIVOS, CLIENTES);
            });

            socket.on(EVENTOS.FORZAR_ACCION, async (payload) => {
                await forzarEvento(io, socket, payload, CLIENTES);
            });

            socket.on(EVENTOS.LISTAR_CLIENTES, async (payload) => {
                await listarDispositivos(io, socket, payload, DISPOSITIVOS);
            });

            socket.on(EVENTOS.DESCONEXION, async (payload) => {
                await desconexion(io, socket, payload, DISPOSITIVOS, CLIENTES);
            });

        } catch(excepcion) {
            console.log('Ocurrio un error');
            console.log(excepcion);

        }
    });
};
