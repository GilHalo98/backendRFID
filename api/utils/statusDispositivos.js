class estatusDispositivos {
    // Status de dispositivo no inicializado.
    DESCONECTADO = 0b00000000;

    CONECTADO = 0b00000001;
    LIBRE = 0b00000010;
    PERIFERICOS_NO_INICIALIZADOS = 0b00000100;
    OCUPADO = 0b00001000;
    BLOQUEADO = 0b00010000;

    LIBRE_3 = 0b00100000;
    LIBRE_4 = 0b01000000;
    LIBRE_5 = 0b10000000;
};

module.exports = {
    estatusDispositivos
};