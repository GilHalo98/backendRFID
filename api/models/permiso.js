'use strict';

// Incluimos la funcion de formateo de fechas.
const { toSQLDate } = require("../utils/utils");


const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class permiso extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            permiso.hasMany(
                models.rol,
                {foreignKey: 'idPermisoVinculado', onDelete: 'cascade'}
            )
        }
    }
    permiso.init({
        // Atributos
        descripcionPermiso: DataTypes.STRING,
        autorizacion: DataTypes.INTEGER,

        fechaRegistroPermiso: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaRegistroPermiso', toSQLDate(fecha));
            }
        },
        fechaModificacionPermiso: {
            type: DataTypes.DATE,
            set(fecha) {
                // Formateamos el formato de la fecha del registro
                // a corde al soportado por la DB.
                this.setDataValue('fechaModificacionPermiso', toSQLDate(fecha));
            }
        },
    }, {
        sequelize,
        modelName: 'permiso'
    });

    return permiso;
};