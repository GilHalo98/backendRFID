'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../../config/database.js');
const db = {};

let sequelize;
if (config.use_env_variable) {
    sequelize = new Sequelize(
        process.env[config.use_env_variable],
        config
    );

} else {
    sequelize = new Sequelize(
        config.database,
        config.username,
        config.password,
        config
    );
}
/*
fs
    .readdirSync(__dirname)
    .filter(file => {
        return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
    })
    .forEach(file => {
        const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
        db[model.name] = model;
    });
*/

// Importar los modelos de manera estatica si se quiere compilar el programa.
const reporteActividad = require(
    "./reporteactividad.js"
)(sequelize, Sequelize.DataTypes);

const reporteDispositivo = require(
    "./reportedispositivo.js"
)(sequelize, Sequelize.DataTypes);

const tipoDispositivo = require(
    "./tipodispositivo.js"
)(sequelize, Sequelize.DataTypes);

const reporteChequeo = require(
    "./reportechequeo.js"
)(sequelize, Sequelize.DataTypes);

const dispositivoiot = require(
    "./dispositivoiot.js"
)(sequelize, Sequelize.DataTypes);

const reporteAcceso = require(
    "./reporteacceso.js"
)(sequelize, Sequelize.DataTypes);

const horario = require(
    "./horario.js"
)(sequelize, Sequelize.DataTypes);

const tipoReporte = require(
    "./tiporeporte.js"
)(sequelize, Sequelize.DataTypes);

const diaLaboral = require(
    "./dialaboral.js"
)(sequelize, Sequelize.DataTypes);

const empleado = require(
    "./empleado.js"
)(sequelize, Sequelize.DataTypes);

const permiso = require(
    "./permiso.js"
)(sequelize, Sequelize.DataTypes);

const reporte = require(
    "./reporte.js"
)(sequelize, Sequelize.DataTypes);

const recurso = require(
    "./recurso.js"
)(sequelize, Sequelize.DataTypes);

const usuario = require(
    "./usuario.js"
)(sequelize, Sequelize.DataTypes);

const zona = require(
    "./zona.js"
)(sequelize, Sequelize.DataTypes);

const rol = require(
    "./rol.js"
)(sequelize, Sequelize.DataTypes);


// Se crea una lista con los modelos.
const modelos = [
    reporteDispositivo,
    reporteActividad,
    tipoDispositivo,
	dispositivoiot,
    reporteChequeo,
    reporteAcceso,
	tipoReporte,
    diaLaboral,
	empleado,
    horario,
	permiso,
	reporte,
	usuario,
    recurso,
    zona,
	rol,
]

// Cada modelo es vinculado con su nombre en un diccionario.
modelos.forEach(model => {
    db[model.name] = model;
});

// Se asocian los modelos a la db.
Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
        db[modelName].associate(db);
    }
});

// Hasta aqui termina el importar los modelos de manera estatica para
// crear el programa compilado.

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
