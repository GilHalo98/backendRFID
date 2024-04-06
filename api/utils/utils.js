// En la conversion de las fechas y el tiempo no se toma en cuenta el GMT.
// HINT esta en
// const prueba = new Date()
// console.log(prueba.toString());

function toSQLDate(fecha) {
    const fechaAux = new Date(fecha);

    // Solucion temporal, hay que ver si esto depende de la db, su
    // configuracion o que pedo.
    // POR LO QUE VEO ES PEDO DIRECTO DE MYSQL QUE NO SOPORTA TIMEZONES.
    const timeZone = fechaAux.getTimezoneOffset() * 2;

    const offsetHoras = Math.floor(timeZone / 60);
    const offsetMinutos = Math.floor(timeZone / (60*60));

    fechaAux.setHours(
        fechaAux.getHours() - offsetHoras,
        fechaAux.getMinutes() - offsetMinutos
    );

    const fechaFormateada = fechaAux.toISOString().slice(
        0,
        19
    ).replace('T', ' ');

    // Cambia de formato la fecha dada al formato aceptado por SQL.
    return fechaFormateada;
};

function toSQLTime(fecha) {
    const fechaAux = new Date(fecha);

    // Solucion temporal, hay que ver si esto depende de la db, su
    // configuracion o que pedo.
    // POR LO QUE VEO ES PEDO DIRECTO DE MYSQL QUE NO SOPORTA TIMEZONES.
    const timeZone = fechaAux.getTimezoneOffset();

    const offsetHoras = Math.floor(timeZone / 60);
    const offsetMinutos = Math.floor(timeZone / (60*60));

    fechaAux.setHours(
        fechaAux.getHours() - offsetHoras,
        fechaAux.getMinutes() - offsetMinutos
    );

    // Cambia de formato la fecha dada al formato aceptado por SQL.
    return fechaAux.toISOString().slice(0, 19).replace('T', ' ').split(' ')[1];
}

function toDateTime(tiempo) {
    const tiempoFracciones = tiempo.split(":");
    const fecha = new Date();
    fecha.setHours(
        tiempoFracciones[0],
        tiempoFracciones[1],
        tiempoFracciones[2]    
    );

    return fecha;
}

function calcularEdad(fechaNacimiento) {
    // Calcula la edad en base a la fecha generada aleatoriamente.
    const fecha = new Date();

    return fecha.getFullYear() - fechaNacimiento.getFullYear();
};

function generarNombreUsuario(nombreCompleto) {
    let nombreUsuario = 'AC-';

    const atomos = nombreCompleto.split(' ');

    nombreUsuario += atomos[0] + '-'

    for (let index = 1; index < atomos.length; index++) {
        nombreUsuario += atomos[index][0];
    }

    return nombreUsuario.toUpperCase();
};

function generarPassword(fechaRegistro) {
    let password = 'AC-';

    fecha = fechaRegistro.split(' ')[0];
    const atomos = fecha.split('-');
    for (let index = 0; index < atomos.length; index++) {
        password += atomos[index];
    }

    return password.toUpperCase();
};

module.exports = {
    toSQLDate,
    toSQLTime,
    toDateTime,
    calcularEdad,
    generarNombreUsuario,
    generarPassword
};