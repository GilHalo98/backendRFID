// Libreria para la manipulacion de archivos.
const multer = require("multer");

// Importa el ambiente en el que se trabaja.
require("dotenv").config();

// Variables de entorno.
const DIR = process.env.BASE_DIR;

const imageFilter = (request, archivo, callback) => {
    if(archivo.mimetype.startsWith('image')) {
        callback(null, true);

    } else {
        callback(
            'Tipo de archivo invalido, solo se aceptan imagenes',
            false
        );
    }
};

var storage = multer.diskStorage({
    destination: (request, archivo, callback) => {
        callback(null, DIR + 'recursos/uploads/');
    },
    filename: (request, archivo, callback) => {
        callback(null, `${Date.now()}-AC-${archivo.originalname}`);
    },
});

var uploadFile = multer({ storage: storage, fileFilter: imageFilter });

// Exportamos el middleware para la subida de archivos.
module.exports = uploadFile;
