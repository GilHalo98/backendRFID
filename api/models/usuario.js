'use strict';

// Incluimos la funcion de formateo de fechas.
const { toSQLDate } = require("../utils/utils");

// Para encriptar la contraseña
const bcrypjs = require("bcryptjs");

const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class usuario extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            usuario.belongsTo(
                models.empleado,
                {foreignKey: 'idRegistroEmpleadoVinculado', onDelete: 'cascade'}
            )
        }
    }
    usuario.init({
        // Atributos.
        nombreUsuario: DataTypes.STRING,
        password: {
            type: DataTypes.STRING,
            set(password) {
                // Encriptamos directamente la contraseña.

                // Realizamos una key para el encriptado.
                const salt = bcrypjs.genSaltSync(10);

                // Encriptamos la contraseña.
                const hash = bcrypjs.hashSync(password, salt);

                // Guardamos la contraseña encriptada en el registro.
                this.setDataValue('password', hash);
            }
        },

        fechaRegistroUsuario: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaRegistroUsuario', toSQLDate(fecha));
            }
        },
        fechaModificacionUsuario: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaModificacionUsuario', toSQLDate(fecha));
            }
        },

        // FK.
        idRegistroEmpleadoVinculado: DataTypes.INTEGER
    }, {
        sequelize,
        modelName: 'usuario',
        tableName: 'usuarios'
    });
    return usuario;
};