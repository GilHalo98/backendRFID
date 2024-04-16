const mostrarLog = async (log) => {
    const fechaLog = new Date();

    const timeZone = fechaLog.getTimezoneOffset() * 2;

    const offsetHoras = Math.floor(timeZone / 60);
    const offsetMinutos = Math.floor(timeZone / (60*60));

    fechaLog.setHours(
        fechaLog.getHours() - offsetHoras,
        fechaLog.getMinutes() - offsetMinutos
    );

    console.log(fechaLog, log);
};

module.exports = {
    mostrarLog
};
