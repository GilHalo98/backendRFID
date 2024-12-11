// Incluimos las funciones propias
const { Sequelize } = require("sequelize");

// Importa el ambiente en el que se trabaja.
require("dotenv").config();

// Variables del entorno.
const PORT = process.env.PORT;
const HOST = process.env.HOST;
const DB_USER = process.env.DB_USER;
const DB_PASS = process.env.DB_PASS;
const DB_DIALECT = process.env.DB_DIALECT;
const DB_DATABASE = process.env.DB_DATABASE;


const validarConexionDB = (
    onOK
) => {
    /**
     * Esperamos la validacion de la base de datos para que pueda
     * iniciar el servidor sockets y API.
     */

    // Instanciamos el ORM.
    const conexionDB = new Sequelize(
        DB_DATABASE,
        DB_USER,
        DB_PASS,
        {
            host: HOST,
            dialect: DB_DIALECT
        }
    );

    // Validamos la conexion con la DB.
    console.log("VALIDANDO CONEXION CON LA DB");

    // Validamos la conexion con la base de datos.
    conexionDB.validate().then(() => {
        console.log('BASE DE DATOS OPERATIVA');

        // Si la validacion fue correcta, entonces iniciamos el
        // servidor socket y API.
        onOK();

    }).catch((ERROR) => {
        console.log('BASE DE DATOS NO OPERATIVA');
        console.log('REINTENTANDO VALIDACION EN 3s...');

        // Si la validacion no fue correcta, entonces reintentamos.
        setTimeout(() => {validarConexionDB(onOK)}, 3000);

    });
};

module.exports = {
    validarConexionDB
};