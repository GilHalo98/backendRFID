'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tiposDispositivos', {
        id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER    
        },

        nombreTipoDispositivo: {
            type: Sequelize.STRING
        },
        descripcionTipoDispositivo: {
            type: Sequelize.STRING
        },

        fechaRegistroTipoDispositivo: {
            type: Sequelize.DATE
        },

        fechaModificacionTipoDispositivo: {
            type: Sequelize.DATE
        },

        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('tiposDispositivos');
    }
};