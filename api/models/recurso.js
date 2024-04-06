'use strict';

// Incluimos la funcion de formateo de fechas.
const { toSQLDate } = require("../utils/utils");

const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class recurso extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            recurso.hasOne(
                models.empleado,
                {foreignKey: 'idImagenVinculada', onDelete: 'cascade'}
            )
        }
    }
    recurso.init({
        fechaRegistroRecurso: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaRegistroRecurso', toSQLDate(fecha));
            }
        },
        fechaModificacionRecurso: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaModificacionRecurso', toSQLDate(fecha));
            }
        },

        // Atributos.
        tipo: DataTypes.STRING,
        nombre: DataTypes.STRING,
        data: {
            type: DataTypes.BLOB('long'),

            get() {
                // Pasamos el formato de ArrayBuffer a Base64
                var binary = '';

                const bytes = new Uint8Array(
                    this.getDataValue('data')
                );

                const len = bytes.byteLength;

                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }

                return binary;
            }
        }
    }, {
        sequelize,
        modelName: 'recurso',
        tableName: 'recursos'
    });
    return recurso;
};