const jwt = require('jsonwebtoken');

// Para encriptar la api key.
const bcrypjs = require("bcryptjs");

const API_KEY = process.env.API_KEY;

const getToken = (payload, config) => {
    // Realizamos una key para el encriptado.
    const salt = bcrypjs.genSaltSync(10);

    // Encriptamos la api key.
    const hash_api_key = bcrypjs.hashSync(API_KEY, salt);

    // Guardamos el hash del api key en el token
    payload['api_key'] = hash_api_key;

    // Crea un token con el payload pasado.
    return jwt.sign(
        payload,
        process.env.SECRET,
        config
    );
}

const getTokenPayload = async (token) => {
    // Recupera los datos del token.

    // Instanciamos el payload nulo.
    let payload = null;

    // Desencriptamos el payload del token.
    jwt.verify(token, process.env.SECRET, (error, decoded) => {
        // Si ocurrio un error al desencriptar el payload.
        if(error) {
            // Lo mostramos en la consola.
            console.log(`Error al decodificar datos en el token: ${error}`);
        } else {
            // Sino, asinamos el payload.
            payload = decoded;
        }
    });

    // Si se decodifico un payload
    if(payload){
        // Si existe el api key en el payload.
        if(payload.api_key) {
            // Realizamos un match del api key del token con la
            // api key esperada.
            const match = await bcrypjs.compare(API_KEY, payload.api_key);

            if(match) {
                // Si hay match, retornamos el payload.
                return payload;

            } else {
                // No hay match, la api key es invalida.
                console.log('Error, api key no valida');
                return null;
            }


        } else {
            // Si no existe, retorna nulo.
            console.log('Error, api key no proporcionada');
            return null;    
        }
    }

    return payload;
}

module.exports = {
    getToken,
    getTokenPayload
}
