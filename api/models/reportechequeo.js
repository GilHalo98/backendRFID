'use strict';

// Incluimos la funcion de formateo de fechas.
const { toSQLDate } = require("../utils/utils");

const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class reporteChequeo extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */

        static associate(models) {
            // define association here
            reporteChequeo.belongsTo(
                models.reporte,
                {foreignKey: 'idReporteVinculado', onDelete: 'cascade'}
            )

            reporteChequeo.belongsTo(
                models.empleado,
                {foreignKey: 'idEmpleadoVinculado', onDelete: 'cascade'}
            )
        }
    }

    reporteChequeo.init({
        fechaRegistroReporteChequeo: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaRegistroReporteChequeo', toSQLDate(fecha));
            }
        },
        fechaModificacionReportChequeo: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaModificacionReportChequeo', toSQLDate(fecha));
            }
        },

        idReporteVinculado: DataTypes.INTEGER,
        idEmpleadoVinculado: DataTypes.INTEGER
    }, {
        sequelize,
        modelName: 'reporteChequeo',
        tableName: 'reportesChequeos'
    });
    return reporteChequeo;
};