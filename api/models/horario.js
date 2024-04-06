'use strict';

// Incluimos la funcion de formateo de fechas.
const { toSQLDate, toSQLTime } = require("../utils/utils");

const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class horario extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            horario.belongsTo(
                models.empleado,
                {foreignKey: 'idEmpleadoVinculado', onDelete: 'cascade'}
            )

            horario.hasMany(
                models.diaLaboral,
                {foreignKey: 'idHorarioVinculada', onDelete: 'cascade'}
            )
        }
    }

    horario.init({
        descripcionHorario: DataTypes.STRING,
        tolerancia: {
            type: DataTypes.TIME,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('tolerancia', toSQLTime(fecha));
            },
        },

        fechaRegistroHorario: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaRegistroHorario', toSQLDate(fecha));
            }
        },

        fechaModificacionHorario: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaModificacionHorario', toSQLDate(fecha));
            }
        },

        idEmpleadoVinculado: DataTypes.INTEGER
    }, {
        sequelize,
        modelName: 'horario',
        tableName: 'horarios'
    });

    return horario;
};