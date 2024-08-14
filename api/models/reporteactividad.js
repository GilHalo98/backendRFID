'use strict';

// Incluimos la funcion de formateo de fechas.
const { toSQLDate } = require("../utils/utils");

const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class reporteActividad extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            reporteActividad.belongsTo(
                models.reporte,
                {foreignKey: 'idReporteVinculado', onDelete: 'cascade'}
            )

            reporteActividad.belongsTo(
                models.empleado,
                {foreignKey: 'idEmpleadoVinculado', onDelete: 'cascade'}
            )
        }
        
    }
    reporteActividad.init({
        // Atributos
        fechaRegistroReporteActividad: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue(
                    'fechaRegistroReporteActividad',
                    toSQLDate(fecha)
                );
            }
        },
        fechaModificacionReporteActividad: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue(
                    'fechaModificacionReporteActividad',
                    toSQLDate(fecha)
                );
            }
        },

        // FK
        idReporteVinculado: DataTypes.INTEGER,
        idEmpleadoVinculado: DataTypes.INTEGER,
        idDispositivoVinculado: DataTypes.INTEGER,
    }, {
        sequelize,
        modelName: 'reporteActividad',
        tableName: 'reportesActividades'
    });
    return reporteActividad;
};