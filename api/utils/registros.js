/**
 * TODO: Usar esta funcion en los controladores.
 * reporte de accesos ........ [X]
 * reporte de dispositivos ... [X]
 * reporte de chequeos ....... [X]
 * zona ...................... [x]
 * usuarios .................. [x]
 * tipo reporte .............. [x]
 * tipo dispositivo .......... [x]
 * rol ....................... [x]
 * reporte ................... [x]
 * recursos .................. [x]
 * permiso ................... [x]
 * dispositivo ............... [P]
 * empleado .................. [x]
 * dashboard ................. [P]
 * accion .................... [x]
 */

const existeRegistro = async (Registros, idRegistro) => {
    // Verificamos que el registro vinculado exista.
    const registro = await Registros.findByPk(
        idRegistro
    );

    // Si no existe retornamos false.
    if(!registro) {
        return false;
    }

    // Si existe, retornamos true.
    return true;
};

module.exports = {
    existeRegistro
};
