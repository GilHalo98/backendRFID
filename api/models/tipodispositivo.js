'use strict';

// Incluimos la funcion de formateo de fechas.
const { toSQLDate } = require("../utils/utils");

const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class tipoDispositivo extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            tipoDispositivo.hasMany(
                models.dispositivoIoT,
                {foreignKey: 'idTipoDispositivoVinculado', onDelete: 'cascade'}
            )
        }
    }
    tipoDispositivo.init({
        nombreTipoDispositivo: DataTypes.STRING,
        descripcionTipoDispositivo: DataTypes.STRING,

        fechaRegistroTipoDispositivo: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaRegistroTipoDispositivo', toSQLDate(fecha));
            }
        },
        fechaModificacionTipoDispositivo: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaModificacionTipoDispositivo', toSQLDate(fecha));
            }
        },
    }, {
        sequelize,
        modelName: 'tipoDispositivo',
        tableName: 'tiposDispositivos'
    });
    return tipoDispositivo;
};