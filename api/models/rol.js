'use strict';

// Incluimos la funcion de formateo de fechas.
const { toSQLDate } = require("../utils/utils");

const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class rol extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            rol.hasMany(
                models.empleado,
                {foreignKey: 'idRolVinculado', onDelete: 'cascade'}
            )

            rol.belongsTo(
                models.permiso,
                {foreignKey: 'idPermisoVinculado', onDelete: 'cascade'}
            )
        }
    }
    rol.init({
        // Atributos
        rolTrabajador: DataTypes.STRING,
        descripcionRol: DataTypes.STRING,
        fechaRegistroRol: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaRegistroRol', toSQLDate(fecha));
            }
        },
        fechaModificacionRol: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaModificacionRol', toSQLDate(fecha));
            }
        },

        // FK
        idPermisoVinculado: DataTypes.INTEGER

    }, {
        sequelize,
        modelName: 'rol',
        tableName: 'roles'
    });
    return rol;
};