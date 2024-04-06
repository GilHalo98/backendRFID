// Modelos de la DB
const db = require("../../models/index");

// Status de los dispositivos conectados.
const Estatus = require("../../utils/statusDispositivos");
const ESTATUS_DISPOSITIVOS = new Estatus.estatusDispositivos();

// Eventos del server socket.
const Eventos = require("../../utils/EventosSocket");
const EVENTOS = new Eventos.EventosSockets();

// Para la creacion y lectura de tokens.
const { getTokenPayload } = require("../../utils/jwtConfig");

// Modelos a usar de la db.
const DispositivosIoT = db.dispositivoIoT;
const Usuarios = db.usuario;

// Administramos la cionexion de un cliente.
exports.conexion = async (io, socket, DISPOSITIVOS, CLIENTES) => {
    // Recivimos conexion de un nuevo dispositivo.
    console.log('Cliente conectado: ' + socket.id);

    // Desempaquetamos la autorizacion.
    const token = socket.handshake.headers.authorization;

    try {
        if(token) {
            const payload = await getTokenPayload(token);

            console.log(payload);

            if(payload.idUsuario) {
                const usuario = await Usuarios.findByPk(payload.idUsuario);

                if(usuario) {
                    // La idea es que los clientes que no sean dispositivos son monitores
                    // se agregaran a una sala llamada monitores, esto unicamente si
                    // los clientes son validados con el token, si no tienen tokens, 
                    // seria mejor que los desconectara.
                    socket.join('monitores');

                    return;
                }

            } else if(payload.idDispositivo) {
                // Buscamos que el dispositivo exista en la db.
                const dispositivo = await DispositivosIoT.findByPk(
                    payload.idDispositivo
                );

                if(dispositivo) {
                    // Lo siguiente es ver si el cliente con id de dispositivo
                    // ya existe en la lista de clientes.
                    for(let uuid_cliente_en_lista in CLIENTES) {
                        
                        // si ya existe, entonces solo actualizamos el uuid.
                        if(dispositivo.id == CLIENTES[uuid_cliente_en_lista]) {
                            delete CLIENTES[uuid_cliente_en_lista];
                        }
                    }
            
                    // Si el dispositivo es valido, lo registramos en la
                    // lista de clientes conectados.
                    CLIENTES[socket.id] = payload.idDispositivo;
            
                    // Registramos un dispositivo en la lista
                    // de dispositivos y asignamos la sala al que pertenece.
                    DISPOSITIVOS[payload.idDispositivo] = {
                        status: ESTATUS_DISPOSITIVOS.DESCONECTADO,
                        sala: dispositivo.idZonaVinculada,
                        tipoDispositivo: dispositivo.idTipoDispositivoVinculado
                    }
            
                    // Lo conectamos a la sala.
                    socket.join(dispositivo.idZonaVinculada);

                    console.log('-------------------------------');
                    console.log(DISPOSITIVOS);
                    console.log(CLIENTES);
                    console.log('-------------------------------');

                    return;
            
                }
            }
        }

    } catch(excepcion) {
        // Mostramos el error en la consola
        console.log(excepcion);
    }
};

// Administramos la descionexion de un cliente.
exports.desconexion = async (io, socket, payload, DISPOSITIVOS, CLIENTES) => {
    const consulta = !payload ? {} : payload;

    try {
        console.log('Cliente desconectado: ' + socket.id);

        // Reportamos a los monitores la desconecion del cliente.
        io.to('monitores').emit(EVENTOS.CLIENTE_TERMINADO);

        delete DISPOSITIVOS[CLIENTES[socket.id]];
        delete CLIENTES[socket.id];

    } catch(excepcion) {
        // Mostramos el error en la consola
        console.log(excepcion);
    }
};