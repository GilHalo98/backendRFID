'use strict';

// Incluimos la funcion de formateo de fechas.
const { toSQLDate } = require("../utils/utils");

const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class tipoReporte extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            tipoReporte.hasMany(
                models.reporte,
                {foreignKey: 'idTipoReporteVinculado', onDelete: 'cascade'}
            );
        }
    }
    tipoReporte.init({
        // Atributos
        nombreTipoReporte: DataTypes.STRING,
        descripcionTipoReporte: DataTypes.STRING,
        tagTipoReporte: DataTypes.STRING,

        fechaRegistroTipoReporte: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaRegistroTipoReporte', toSQLDate(fecha));
            }
        },
        fechaModificacionTipoReporte: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaModificacionTipoReporte', toSQLDate(fecha));
            }
        },
    }, {
        sequelize,
        modelName: 'tipoReporte',
        tableName: 'tiposReportes',
    });
    return tipoReporte;
};
