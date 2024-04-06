class EventosSockets {
    // Evento de conexion de cliente.
    CONEXION = 'connect';

    // Evento de desconexion de cliente
    DESCONEXION = 'disconnect';

    // Evento de reporte de status.
    REPORTAR_STATUS = 'reportar_status';

    // Evento de peticion de acceso a una zona.
    PETICION_ACCESO = 'peticion_acceso';

    // Evento de peticion de acceso a una zona.
    PETICION_ACCESO_BLOQUEAR = 'peticion_acceso_bloquear';

    // Evento de peticion de acceso a una zona.
    PETICION_ACCESO_DESBLOQUEAR = 'peticion_acceso_desbloquear';

    // Retorna la lista de los clientes.
    LISTAR_CLIENTES = 'listar_clientes';

    // Fuerza a realizar una accion a un dispositivo.
    FORZAR_ACCION = 'forzar_accion';

    // Envia un evento de cliente terminado al server.
    CAMBIO_ESTATUS = 'cambio_estatus';

    // Envia un evento de cliente conectado al server.
    CLIENTE_CONECTADO = 'cliente_conectado';

    // Envia un evento de cliente terminado al server.
    CLIENTE_TERMINADO = 'cliente_terminado';

    // Evento de acceso garantizado.
    GARANTIZAR_ACCESO = 'garantizar_acceso';

    // Evento de acceso negado.
    NEGAR_ACCESO = 'negar_acceso';

    // Evento de acceso garantizado.
    GARANTIZAR_ACCESO_BLOQUEAR = 'garantizar_acceso_bloquear';

    // Evento de acceso negado.
    NEGAR_ACCESO_DESBLOQUEAR = 'negar_acceso_desbloquear';

    // Evento de envio de lista de clientes.
    LISTA_CLIENTES = 'lista_clientes';

    // Bloquea el uso de un dispositivo controlador de puertas.
    BLOQUEAR_PUERTA = 'bloquear_puerta';
    
    // Desbloquea el uso de un dispositivo controlador de puertas.
    DESBLOQUEAR_PUERTA = 'desbloquear_puerta';

    // Envia la accion de abrir puerta a un controlador de puertas.
    ABRIR_PUERTA = 'abrir_puerta';

    // Envia la accion de cerrar puerta a un controlador de puertas.
    CERRAR_PUERTA = 'cerrar_puerta';

    // Envia la accion de desbloquear y abrir puerta a un controlador de puertas.
    DESBLOQUEAR_ABRIR_PUERTA = 'desbloquear_abrir_puerta';

    // Envia la accion de cerrar y bloquear puerta a un controlador de puertas.
    CERRAR_BLOQUEAR_PUERTA = 'cerrar_bloquear_puerta';

    // Envia la accion de activar a un controlador de maquinas.
    DESACTIVAR = 'desactivar';
    
    // Envia la accion de desactivar a un controlador de maquinas.
    ACTIVAR = 'activar';
};

module.exports = {
    EventosSockets
};