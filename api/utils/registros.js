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
