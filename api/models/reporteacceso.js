'use strict';

// Incluimos la funcion de formateo de fechas.
const { toSQLDate } = require("../utils/utils");

const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class reporteAcceso extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            reporteAcceso.belongsTo(
                models.reporte,
                {foreignKey: 'idReporteVinculado', onDelete: 'cascade'}
            )

            reporteAcceso.belongsTo(
                models.empleado,
                {foreignKey: 'idEmpleadoVinculado', onDelete: 'cascade'}
            )

            reporteAcceso.belongsTo(
                models.zona,
                {foreignKey: 'idZonaVinculada', onDelete: 'cascade'}
            )
        }
    }

    reporteAcceso.init({
        fechaRegistroReporteAcceso: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaRegistroReporteAcceso', toSQLDate(fecha));
            }
        },
        fechaModificacionReporteAcceso: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaModificacionReporteAcesso', toSQLDate(fecha));
            }
        },

        idReporteVinculado: DataTypes.INTEGER,
        idEmpleadoVinculado: DataTypes.INTEGER,
        idZonaVinculada: DataTypes.INTEGER

    }, {
        sequelize,
        modelName: 'reporteAcceso',
        tableName: 'reportesAccesos',
    });

    return reporteAcceso;
};