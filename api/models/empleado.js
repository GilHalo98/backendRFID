'use strict';

// Incluimos la funcion de formateo de fechas.
const { toSQLDate, calcularEdad } = require("../utils/utils");

const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class empleado extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            empleado.belongsTo(
                models.rol,
                {foreignKey: 'idRolVinculado', onDelete: 'cascade'}
            )

            empleado.hasOne(
                models.usuario,
                {foreignKey: 'idRegistroEmpleadoVinculado', onDelete: 'cascade'}
            )

            empleado.belongsTo(
                models.recurso,
                {foreignKey: 'idImagenVinculada', onDelete: 'cascade'}
            )

            empleado.hasMany(
                models.reporteAcceso,
                {foreignKey: 'idEmpleadoVinculado', onDelete: 'cascade'}
            )

            empleado.hasMany(
                models.reporteChequeo,
                {foreignKey: 'idEmpleadoVinculado', onDelete: 'cascade'}
            )

            empleado.hasMany(
                models.semanaLaboral,
                {foreignKey: 'idEmpleadoVinculado', onDelete: 'cascade'}
            )
        }
    }

    empleado.init({
        // Atributos
        nombres: DataTypes.STRING,
        apellidoPaterno: DataTypes.STRING,
        apellidoMaterno: DataTypes.STRING,

        numeroTelefonico: DataTypes.STRING,

        edad: DataTypes.INTEGER,

        fechaNacimiento: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaNacimiento', toSQLDate(fecha));

                // Calculamos la edad y la agregamos al campo de edad.
                this.setDataValue('edad', calcularEdad(fecha));
            }
        },

        fechaRegistroEmpleado: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaRegistroEmpleado', toSQLDate(fecha));
            }
        },

        fechaModificacionEmpleado: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaModificacionEmpleado', toSQLDate(fecha));
            }
        },

        // FK
        idRolVinculado: DataTypes.INTEGER,
        idImagenVinculada: DataTypes.INTEGER
    }, {
        sequelize,
        modelName: 'empleado',
        tableName: 'empleados'
    });

    return empleado;
};
