'use strict';

// Incluimos la funcion de formateo de fechas.
const { toSQLDate } = require("../utils/utils");

const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class reporteDispositivo extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
        */
       
       static associate(models) {
            // define association here
            reporteDispositivo.belongsTo(
                models.dispositivoIoT,
                {foreignKey: 'idDispositivoVinculado', onDelete: 'cascade'}
            )

            reporteDispositivo.belongsTo(
                models.reporte,
                {foreignKey: 'idReporteVinculado', onDelete: 'cascade'}
            )
        }
    }
    reporteDispositivo.init({
        fechaRegistroReporteDispositivo: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaRegistroReporteDispositivo', toSQLDate(fecha));
            }
        },
        fechaModificacionReporteDispositivo: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaModificacionReporteDispositivo', toSQLDate(fecha));
            }
        },

        idReporteVinculado: DataTypes.INTEGER,
        idDispositivoVinculado: DataTypes.INTEGER,
    }, {
        sequelize,
        modelName: 'reporteDispositivo',
        tableName: 'reportesDispositivos'
    });
    return reporteDispositivo;
};