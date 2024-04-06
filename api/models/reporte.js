'use strict';

// Incluimos la funcion de formateo de fechas.
const { toSQLDate } = require("../utils/utils");

const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class reporte extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            reporte.belongsTo(
                models.tipoReporte,
                {foreignKey: 'idTipoReporteVinculado', onDelete: 'cascade'}
            )

            reporte.hasOne(
                models.reporteDispositivo,
                {foreignKey: 'idReporteVinculado', onDelete: 'cascade'}
            )

            reporte.hasOne(
                models.reporteAcceso,
                {foreignKey: 'idReporteVinculado', onDelete: 'cascade'}
            )

            reporte.hasOne(
                models.reporteChequeo,
                {foreignKey: 'idReporteVinculado', onDelete: 'cascade'}
            )

            reporte.hasOne(
                models.reporteActividad,
                {foreignKey: 'idReporteVinculado', onDelete: 'cascade'}
            )
        }
        
    }
    reporte.init({
        // Atributos
        descripcionReporte: DataTypes.STRING,

        fechaRegistroReporte: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaRegistroReporte', toSQLDate(fecha));
            }
        },
        fechaModificacionReporte: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaModificacionReporte', toSQLDate(fecha));
            }
        },

        // FK
        idTipoReporteVinculado: DataTypes.INTEGER,
    }, {
        sequelize,
        modelName: 'reporte',
        tableName: 'reportes'
    });
    return reporte;
};