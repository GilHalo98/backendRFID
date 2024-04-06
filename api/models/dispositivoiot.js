'use strict';

// Incluimos la funcion de formateo de fechas.
const { toSQLDate } = require("../utils/utils");

const {
    Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class dispositivoIoT extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            dispositivoIoT.belongsTo(
                models.zona,
                {foreignKey: 'idZonaVinculada', onDelete: 'cascade'}
            )

            dispositivoIoT.belongsTo(
                models.tipoDispositivo,
                {foreignKey: 'idTipoDispositivoVinculado', onDelete: 'cascade'}
            )

            dispositivoIoT.hasMany(
                models.reporteDispositivo,
                {foreignKey: 'idReporteVinculado', onDelete: 'cascade'}
            )
        }
    }
    dispositivoIoT.init({
        descripcionDispositivo: DataTypes.STRING,

        fechaRegistroIoT: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaRegistroIoT', toSQLDate(fecha));
            }
        },
        fechaModificacionIoT: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaModificacionIoT', toSQLDate(fecha));
            }
        },

        idZonaVinculada: DataTypes.INTEGER,
        idTipoDispositivoVinculado: DataTypes.INTEGER
    }, {
        sequelize,
        modelName: 'dispositivoIoT',
        tableName: 'dispositivosIoT'
    });
    return dispositivoIoT;
};