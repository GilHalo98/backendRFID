class CodigoApp {
    // Código de error con la API.
    API_ERROR = -1;

    // Código que indica operación exitosa.
    OK = 0;

    // Códigos de dato no encontrado. (1, 255)
    EMPLEADO_NO_ENCONTRADO = 1;
    PERMISO_NO_ENCONTRADO = 2;
    ROL_NO_ENCONTRADO = 3;
    REPORTE_NO_ENCONTRADO = 4;
    TIPO_REPORTE_NO_ENCONTRADO = 5;
    DISPOSITIVO_IOT_NO_ENCONTRADO = 6;
    ZONA_NO_ENCONTRADA = 7;
    USUARIO_NO_ENCONTRADO = 8;
    TIPO_DISPOSITIVO_NO_ENCONTRADO = 9;
    HORARIO_NO_ENCONTRADO = 10;
    DIA_LABORAL_NO_ENCONTRADO = 11;

    // Códigos de datos para registros/Busqueda invalidos/incompletos. (256, 512)
    DATOS_REGISTRO_INCOMPLETOS = 256;
    REGISTRO_VINCULADO_NO_EXISTE = 257;
    DATOS_BUSQUEDA_INCOMPLETOS = 258;
    REGISTRO_YA_EXISTE = 259;
    DATOS_PARA_MODIFICACION_INCOMPLETOS = 260;
    OLD_PASSWORD_INCORRECTA = 261;
    DATOS_PARA_LOGIN_INCOMPLETOS = 262;
    DATOS_PARA_LOGIN_INCORRECTOS = 263;

    // Códigos de tokens. (513; 924)
    TOKEN_NO_INGRESADO = 513;
    TOKEN_INVALIDO = 514;

    // Códigos de operaciones de dispositivos. (925, 932)
    OPERACION_INVALIDA = 925;
};

module.exports = {
    CodigoApp
};
