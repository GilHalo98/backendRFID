const {
    toDateTime,
    toSQLDate
} = require("./utils");

function empleadoLlegoATiempo(
    horaEntrada, toleranciaEntrada, fecha
) {
    // Duplicamos la fecha actual.
    const horaLlegada = new Date(fecha);

    // Pasamos la tolerancia y la hora de entrada a objetos Date.
    const tolerancia = toDateTime(toleranciaEntrada);
    const entrada = toDateTime(horaEntrada);

    // Agregamos la tolerancia a la hora de entrada.
    entrada.setHours(
        entrada.getHours() + tolerancia.getHours(),
        entrada.getMinutes() + tolerancia.getMinutes(),
        entrada.getSeconds() + tolerancia.getSeconds(),
    );

    // Les quitamos el offset del timezone.
    const timeZone = horaLlegada.getTimezoneOffset();

    const offsetHoras = Math.floor(timeZone / 60);
    const offsetMinutos = Math.floor(timeZone / (60 * 60));

    entrada.setHours(
        entrada.getHours() - offsetHoras,
        entrada.getMinutes() - offsetMinutos
    );

    horaLlegada.setHours(
        horaLlegada.getHours() - offsetHoras,
        horaLlegada.getMinutes() - offsetMinutos
    );

    // Verificamos que el empleado llego a tiempo.
    let llegoATiempo = horaLlegada <= entrada;

    return llegoATiempo;
};

function empleadoSalioTarde(
    horaSalida, toleranciaEntrada, fecha
) {
    // Duplicamos la fecha actual.
    const horaTerminoTurno = new Date(fecha);

    // Pasamos la tolerancia y la hora de salida a objetos Date.
    const tolerancia = toDateTime(toleranciaEntrada);
    const salida = toDateTime(horaSalida);

    // Agregamos la tolerancia a la hora de salida.
    salida.setHours(
        salida.getHours() + tolerancia.getHours(),
        salida.getMinutes() + tolerancia.getMinutes(),
        salida.getSeconds() + tolerancia.getSeconds(),
    );

    // Les quitamos el offset del timezone.
    const timeZone = horaTerminoTurno.getTimezoneOffset();

    const offsetHoras = Math.floor(timeZone / 60);
    const offsetMinutos = Math.floor(timeZone / (60 * 60));

    salida.setHours(
        salida.getHours() - offsetHoras,
        salida.getMinutes() - offsetMinutos
    );

    horaTerminoTurno.setHours(
        horaTerminoTurno.getHours() - offsetHoras,
        horaTerminoTurno.getMinutes() - offsetMinutos
    );

    // Verificamos que el empleado llego a tiempo.
    let salioATiempo = horaTerminoTurno > salida;

    return salioATiempo;
};

function rangoHoy() {
    // Instanciamos dos fechas.
    const fechaA = new Date();
    const fechaB = new Date();

    // La primera va a tener hora de 00:00:00
    fechaA.setHours(0, 0, 0);

    // La segunda tendra hora de 23:59:59
    fechaB.setHours(23, 59, 59);

    // Cambiamos el formato y las retornamos.
    return [
        toSQLDate(fechaA), toSQLDate(fechaB)
    ];
};

module.exports = {
    empleadoLlegoATiempo,
    empleadoSalioTarde,
    rangoHoy
};