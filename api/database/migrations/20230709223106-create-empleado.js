'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('empleados', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },

            nombres: {
                type: Sequelize.STRING
            },

            apellidoPaterno: {
                type: Sequelize.STRING
            },

            apellidoMaterno: {
                type: Sequelize.STRING
            },

            numeroTelefonico: {
                type: Sequelize.STRING
            },

            edad: {
                type: Sequelize.INTEGER
            },

            fechaNacimiento: {
                type: Sequelize.DATE
            },

            fechaRegistroEmpleado: {
                type: Sequelize.DATE
            },

            fechaModificacionEmpleado: {
                type: Sequelize.DATE
            },

            idRolVinculado: {
                type: Sequelize.INTEGER,
                required: true,
                allowNull: false,
                onDelete: 'cascade',
                references: {
                    model: {
                        tableName: "roles",
                    },
                    key: "id",
                },
            },

            idImagenVinculada: {
                type: Sequelize.INTEGER,
                required: true,
                allowNull: false,
                onDelete: 'cascade',
                references: {
                    model: {
                        tableName: "recursos",
                    },
                    key: "id",
                },
            },
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('empleados');
    }
};