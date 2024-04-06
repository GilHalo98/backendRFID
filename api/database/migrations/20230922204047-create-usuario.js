'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('usuarios', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },

            nombreUsuario: {
                type: Sequelize.STRING
            },

            password: {
                type: Sequelize.STRING
            },

            fechaRegistroUsuario: {
                type: Sequelize.DATE
            },

            fechaModificacionUsuario: {
                type: Sequelize.DATE
            },

            idRegistroEmpleadoVinculado: {
                type: Sequelize.INTEGER,
                required: true,
                allowNull: false,
                onDelete: 'cascade',
                references: {
                    model: {
                        tableName: "empleados",
                    },
                    key: "id",
                },
            },
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('usuarios');
    }
};