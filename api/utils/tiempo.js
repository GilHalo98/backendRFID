const {
    toDateTime,
    toSQLDate
} = require("./utils");

function empleadoLlegoATiempo(
    horaEntrada, toleranciaEntrada, fecha
) {
    // Duplicamos la fecha actual.
    const horaLlegada = new Date(fecha);

    console.log(toleranciaEntrada);

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

function rangoDia(dia, semana=null) {
    // Instanciamos dos fechas.
    const fechaA = semana? new Date(semana[0]) : new Date();
    const fechaB = semana? new Date(semana[0]) : new Date();

    // Calculamos el dia de la semana.
    fechaA.setDate(fechaA.getDate() + (dia - fechaA.getDay()) + 1);
    fechaB.setDate(fechaB.getDate() + (dia - fechaB.getDay()) + 1);

    // La primera va a tener hora de 00:00:00
    fechaA.setHours(0, 0, 0);

    // La segunda tendra hora de 23:59:59
    fechaB.setHours(23, 59, 59);

    // Cambiamos el formato y las retornamos.
    return [
        toSQLDate(fechaA), toSQLDate(fechaB)
    ];
};

function rangoSemana() {
    // Instanciamos dos fechas.
    const fechaA = new Date();
    const fechaB = new Date();

    // Les quitamos el offset del timezone.
    const timeZone = fechaA.getTimezoneOffset();

    const offsetHoras = Math.floor(timeZone / 60);
    const offsetMinutos = Math.floor(timeZone / (60 * 60));

    // Calculamos el dia en el que inicia la semana.
    fechaA.setDate(fechaA.getDate() - fechaA.getDay());

    // La primera va a tener hora de 00:00:00
    fechaA.setHours(0, 0, 0);

    // Calculamos el dia en el que termina la semana.
    fechaB.setDate(fechaB.getDate() + (6 - fechaB.getDay()));

    // La segunda tendra hora de 23:59:59
    fechaB.setHours(23, 59, 59);

    return [
        toSQLDate(fechaA), toSQLDate(fechaB)
    ];
};

function deserealizarSemana(semana) {
    // Primero convertimos todos los literales a minusculas.
    const datoSerializado = semana.toLowerCase();

    // Si existe una semana, deserealizamos el
    // dato, primero partimos el string, de
    // año-semana a [año, semana].
    const semanaReporte = datoSerializado.split('-w');

    // Creamos las instancias de las fechas.
    const fechaA = new Date();
    const fechaB = new Date();

    // Establecemos la fecha de inicio de semana.
    fechaA.setFullYear(
        parseInt(semanaReporte[0]),
        0,
        (parseInt(semanaReporte[1]) * 7) - 6
    );

    fechaA.setHours(
        0,
        0,
        0,
        0
    );

    // Establecemos la fecha de fin de semana.
    fechaB.setFullYear(
        parseInt(semanaReporte[0]),
        0,
        (parseInt(semanaReporte[1]) * 7)
    );


    fechaB.setHours(
        23,
        59,
        59,
        0  
    );

    return [
        fechaA, fechaB
    ];
};

function empleadoInicioDescansoATiempo(
    horaInicioDescanso,
    toleranciaInicioDescanso,
    fecha
) {
    // Duplicamos la fecha actual.
    const horaInicio = new Date(fecha);

    // Pasamos la tolerancia y la hora de entrada a objetos Date.
    const tolerancia = toDateTime(toleranciaInicioDescanso);
    const inicio = toDateTime(horaInicioDescanso);

    // Agregamos la tolerancia a la hora de entrada.
    inicio.setHours(
        inicio.getHours() + tolerancia.getHours(),
        inicio.getMinutes() + tolerancia.getMinutes(),
        inicio.getSeconds() + tolerancia.getSeconds(),
    );

    // Les quitamos el offset del timezone.
    const timeZone = horaInicio.getTimezoneOffset();

    const offsetHoras = Math.floor(timeZone / 60);
    const offsetMinutos = Math.floor(timeZone / (60 * 60));

    inicio.setHours(
        inicio.getHours() - offsetHoras,
        inicio.getMinutes() - offsetMinutos
    );

    horaInicio.setHours(
        horaInicio.getHours() - offsetHoras,
        horaInicio.getMinutes() - offsetMinutos
    );

    // Verificamos que el empleado llego a tiempo.
    let inicioATiempo = horaInicio <= inicio;

    return inicioATiempo;
};

function empleadoTerminoDescansoATiempo(
    horaFinDescanso,
    toleranciaFinDescanso,
    fecha
) {
    // Duplicamos la fecha actual.
    const horaFin = new Date(fecha);

    // Pasamos la tolerancia y la hora de entrada a objetos Date.
    const tolerancia = toDateTime(toleranciaFinDescanso);
    const fin = toDateTime(horaFinDescanso);

    // Agregamos la tolerancia a la hora de entrada.
    fin.setHours(
        fin.getHours() + tolerancia.getHours(),
        fin.getMinutes() + tolerancia.getMinutes(),
        fin.getSeconds() + tolerancia.getSeconds(),
    );

    // Les quitamos el offset del timezone.
    const timeZone = horaFin.getTimezoneOffset();

    const offsetHoras = Math.floor(timeZone / 60);
    const offsetMinutos = Math.floor(timeZone / (60 * 60));

    fin.setHours(
        fin.getHours() - offsetHoras,
        fin.getMinutes() - offsetMinutos
    );

    horaFin.setHours(
        horaFin.getHours() - offsetHoras,
        horaFin.getMinutes() - offsetMinutos
    );

    // Verificamos que el empleado llego a tiempo.
    let terminoATiempo = horaFin <= fin;

    return terminoATiempo;
};

function tiempoActual() {
    /*
    * Calcula la fecha actual tomando en cuenta el offset.
    */

    const fechaActual = new Date();

    const timeZone = fechaActual.getTimezoneOffset() * 2;

    const offsetHoras = Math.floor(timeZone / 60);
    const offsetMinutos = Math.floor(timeZone / (60*60));

    fechaActual.setHours(
        fechaActual.getHours() - offsetHoras,
        fechaActual.getMinutes() - offsetMinutos
    );

    return fechaActual;
};

function msToTime(s) {
    var ms = s % 1000;
    s = (s - ms) / 1000;
    var secs = s % 60;
    s = (s - secs) / 60;
    var mins = s % 60;
    var hrs = (s - mins) / 60;

    return hrs + ':' + mins + ':' + secs;
};

module.exports = {
    empleadoInicioDescansoATiempo,
    empleadoTerminoDescansoATiempo,
    empleadoLlegoATiempo,
    empleadoSalioTarde,
    deserealizarSemana,
    tiempoActual,
    rangoSemana,
    rangoHoy,
    rangoDia,
    msToTime
};