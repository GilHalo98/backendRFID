// Status de los dispositivos conectados.
const Estatus = require("../../utils/statusDispositivos");
const ESTATUS_DISPOSITIVOS = new Estatus.estatusDispositivos();

// Eventos del server socket.
const Eventos = require("../../utils/EventosSocket");
const EVENTOS = new Eventos.EventosSockets();

// Administramos la cionexion de un cliente.
exports.reportarEstatus = async (io, socket, payload, DISPOSITIVOS, CLIENTES) => {
    const consulta = !payload ? {} : payload;

    try {
        console.log('nuevo status');

        const nuevoStatus = consulta.status;

        const id = CLIENTES[socket.id];

        DISPOSITIVOS[id].status = nuevoStatus;

        console.log(DISPOSITIVOS);

        // Reportamos un cambio de estatus de dispositivos
        // a los monitores.
        io.to('monitores').emit(EVENTOS.CAMBIO_ESTATUS);

    } catch(excepcion) {
        // Mostramos el error en la consola
        console.log(excepcion);
    }
};

// Administramos la descionexion de un cliente.
exports.peticionAccesoBloquear = async (io, socket, payload, DISPOSITIVOS, CLIENTES) => {
    const consulta = !payload ? {} : payload;

    try {
        const sala = DISPOSITIVOS[CLIENTES[socket.id]].sala;
        // socket.broadcast.to(sala);

        // Consultamos los clientes en la sala a la que el
        // cliente que emite el evento pertenece.
        const clientesSala = await io.in(sala).fetchSockets();

        // Por cada cliente en la sala.
        clientesSala.forEach(cliente => {
            // Si el cliente no esta ocupado.
            if(DISPOSITIVOS[CLIENTES[cliente.id]].status == ESTATUS_DISPOSITIVOS.LIBRE) {
                // Emitimos el evento de la resolucion del acceso.
                const resolucion = (
                    !consulta.resolucion ? consulta.resolucion : parseInt(consulta.resolucion)
                );

                console.log('peticion de acceso con bloqueo de puerta: ' + resolucion.toString());
        
                if(resolucion) {
                    socket.broadcast.to(
                        cliente.id
                    ).emit(EVENTOS.GARANTIZAR_ACCESO_BLOQUEAR, null);

                } else {
                    socket.broadcast.to(
                        cliente.id
                    ).emit(EVENTOS.NEGAR_ACCESO, null);
                }

            }
        });

    } catch(excepcion) {
        // Mostramos el error en la consola
        console.log(excepcion);
    }
};

// Administramos la descionexion de un cliente.
exports.peticionAccesoDesbloquear = async (io, socket, payload, DISPOSITIVOS, CLIENTES) => {
    const consulta = !payload ? {} : payload;

    try {
        const sala = DISPOSITIVOS[CLIENTES[socket.id]].sala;
        // socket.broadcast.to(sala);

        // Consultamos los clientes en la sala a la que el
        // cliente que emite el evento pertenece.
        const clientesSala = await io.in(sala).fetchSockets();

        // Por cada cliente en la sala.
        clientesSala.forEach(cliente => {
            // Si el cliente no esta ocupado.
            if(DISPOSITIVOS[CLIENTES[cliente.id]].status == ESTATUS_DISPOSITIVOS.BLOQUEADO) {
                // Emitimos el evento de la resolucion del acceso.
                const resolucion = (
                    !consulta.resolucion ? consulta.resolucion : parseInt(consulta.resolucion)
                );

                console.log('peticion de acceso con bloqueo de puerta: ' + resolucion.toString());
        
                if(resolucion) {
                    socket.broadcast.to(
                        cliente.id
                    ).emit(EVENTOS.NEGAR_ACCESO_DESBLOQUEAR, null);

                } else {
                    socket.broadcast.to(
                        cliente.id
                    ).emit(EVENTOS.NEGAR_ACCESO, null);
                }

            }
        });

    } catch(excepcion) {
        // Mostramos el error en la consola
        console.log(excepcion);
    }
};

// Administramos la descionexion de un cliente.
exports.peticionAcceso = async (io, socket, payload, DISPOSITIVOS, CLIENTES) => {
    const consulta = !payload ? {} : payload;

    try {
        const sala = DISPOSITIVOS[CLIENTES[socket.id]].sala;
        // socket.broadcast.to(sala);

        // Consultamos los clientes en la sala a la que el
        // cliente que emite el evento pertenece.
        const clientesSala = await io.in(sala).fetchSockets();

        // Por cada cliente en la sala.
        clientesSala.forEach(cliente => {
            const dispositivo = DISPOSITIVOS[CLIENTES[cliente.id]];

            if(dispositivo) {
                // Si el cliente no esta ocupado.
                if(dispositivo.status == ESTATUS_DISPOSITIVOS.LIBRE) {
                    // Emitimos el evento de la resolucion del acceso.
                    const resolucion = (
                        !consulta.resolucion ? consulta.resolucion : parseInt(consulta.resolucion)
                    );

                    console.log('peticion de acceso: ' + resolucion.toString());
            
                    if(resolucion) {
                        socket.broadcast.to(
                            cliente.id
                        ).emit(EVENTOS.GARANTIZAR_ACCESO, null);

                    } else {
                        socket.broadcast.to(
                            cliente.id
                        ).emit(EVENTOS.NEGAR_ACCESO, null);
                    }

                }
            }
        });

    } catch(excepcion) {
        // Mostramos el error en la consola
        console.log(excepcion);
    }
};