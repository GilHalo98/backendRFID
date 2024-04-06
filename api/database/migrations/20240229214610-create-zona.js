'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('zonas', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },

            nombreZona: {
                type: Sequelize.STRING
            },

            descripcionZona: {
                type: Sequelize.STRING
            },

            bitZona: {
                type: Sequelize.INTEGER
            },

            fechaRegistroZona: {
                type: Sequelize.DATE
            },

            fechaModificacionZona: {
                type: Sequelize.DATE
            }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('zonas');
    }
};