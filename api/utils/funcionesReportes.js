// Vericica la continuidad entre los reportes de acceso, actividad.
async function verificarContinuidadReportes(
    listaRegistros,
    tipoReporteA,
    tipoReporteB,
    index=0
) {
    // Consultamos los registros.
    const registroA = listaRegistros[index];
    const registroB = listaRegistros[index + 1];

    // Verificamos que registroA sea de tipo salida a zona.
    if(registroA == tipoReporteA) {
        // Verificamos que el registroB sea de tipo acceso de zona.
        if(registroB == tipoReporteB) {
            // Terminamos el bucle.
            return true;
        }
    }

    // Si todavia quedan reportes por recorrer.
    if(index < listaRegistros.length - 1) {
        // Verificalos recursivamente.
        return verificarContinuidadReportes(
            listaRegistros,
            tipoReporteA,
            tipoReporteB,
            index + 1
        );

    }

    // Sino, retorna falso.
    return false;
};

async function contarContinuidadReprotes(
    listaRegistros,
    tipoReporteA,
    tipoReporteB,
    conteo,
    index=0
) {
    // Dejamos de recursar si ya no hay mas registros que verificar.
    if(index >= listaRegistros.length - 1) {
        return conteo;
    }

    // Consultamos los registros.
    const registroA = listaRegistros[index];
    const registroB = listaRegistros[index + 1];

    // Verificamos que registroA sea de tipo salida a zona.
    if(registroA == tipoReporteA) {
        // Verificamos que el registroB sea de tipo acceso de zona.
        if(registroB == tipoReporteB) {
            // Aumentamos el conteo en 1,
            conteo ++;
        }
    }

    // Recursamos.
    return contarContinuidadReprotes(
        listaRegistros,
        tipoReporteA,
        tipoReporteB,
        conteo,
        index + 1
    );
};

module.exports = {
    contarContinuidadReprotes,
    verificarContinuidadReportes
};