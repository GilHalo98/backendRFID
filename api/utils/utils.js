function toSQLDate(fecha, timeOffset=true) {
    // Si el tiempo es un dato indefinidio, retornamos nulo.
    if(typeof(fecha) == 'undefined') {
        return null;
    }

    const fechaAux = new Date(fecha);

    if(timeOffset) {
        const timeZone = fechaAux.getTimezoneOffset() * 2;

        const offsetHoras = Math.floor(timeZone / 60);
        const offsetMinutos = Math.floor(timeZone / (60*60));
    
        fechaAux.setHours(
            fechaAux.getHours() - offsetHoras,
            fechaAux.getMinutes() - offsetMinutos
        );
    }

    const fechaFormateada = fechaAux.toISOString().slice(
        0,
        19
    ).replace('T', ' ');

    // Cambia de formato la fecha dada al formato aceptado por SQL.
    return fechaFormateada;
};

function toSQLTime(tiempo) {
    // Si el tiempo es un dato indefinidio, retornamos nulo.
    if(typeof(tiempo) == 'undefined') {
        return null;
    }

    // Desempaquetamos el tiempo en HH:MM
    const horasMinutos = tiempo.split(":");

    // Instanciamos un objeto fecha.
    const fechaAux = new Date();

    // Ponemos la hora, minuto, segundo a 00.
    fechaAux.setHours(horasMinutos[0], horasMinutos[1], 0, 0);

    // Solucion temporal, hay que ver si esto depende de la db, su
    // configuracion o que pedo.
    // POR LO QUE VEO ES PEDO DIRECTO DE MYSQL QUE NO SOPORTA TIMEZONES.
    const timeZone = fechaAux.getTimezoneOffset();

    const offsetHoras = Math.floor(
        timeZone / 60
    );
    const offsetMinutos = Math.floor(
        timeZone / (60*60)
    );

    fechaAux.setHours(
        fechaAux.getHours() - offsetHoras,
        fechaAux.getMinutes() - offsetMinutos
    );

    // Cambia de formato la fecha dada al formato aceptado por SQL.
    return fechaAux.toISOString().slice(0, 19).replace('T', ' ').split(' ')[1];
}

function toDateTime(tiempo) {
    // Si el tiempo es un dato indefinidio, retornamos nulo.
    if(typeof(tiempo) == 'undefined') {
        return null;
    }

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
    // Si el tiempo es un dato indefinidio, retornamos nulo.
    if(typeof(tiempo) == 'undefined') {
        return null;
    }

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