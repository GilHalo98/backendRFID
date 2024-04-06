'use strict';

// Incluimos la funcion de formateo de fechas.
const { toSQLDate, toSQLTime } = require("../utils/utils");

const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class diaLaboral extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            diaLaboral.belongsTo(
                models.horario,
                {foreignKey: 'idHorarioVinculada', onDelete: 'cascade'}
            )
        }
    }

    diaLaboral.init({
        dia: DataTypes.INTEGER,

        esDescanso: DataTypes.BOOLEAN,

        horaEntrada: {
            type: DataTypes.TIME,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('horaEntrada', toSQLTime(fecha));
            }
        },

        horaEntradaDescanso: {
            type: DataTypes.TIME,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('horaEntradaDescanso', toSQLTime(fecha));
            }
        },

        horaSalidaDescanso: {
            type: DataTypes.TIME,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('horaSalidaDescanso', toSQLTime(fecha));
            }
        },

        horaSalida: {
            type: DataTypes.TIME,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('horaSalida', toSQLTime(fecha));
            }
        },

        fechaRegistroDia: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaRegistroDia', toSQLDate(fecha));
            }
        },

        fechaModificacionDia: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaModificacionDia', toSQLDate(fecha));
            }
        },

        idHorarioVinculada: DataTypes.INTEGER
    }, {
        sequelize,
        modelName: 'diaLaboral',
        tableName: 'diasLaborales'
    });
    return diaLaboral;
};