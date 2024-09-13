'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('tiposReportes', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },

            nombreTipoReporte: {
                type: Sequelize.STRING
            },

            descripcionTipoReporte: {
                type: Sequelize.STRING
            },

            tagTipoReporte: {
                type: Sequelize.STRING
            },

            fechaRegistroTipoReporte: {
                type: Sequelize.DATE
            },

            fechaModificacionTipoReporte: {
                type: Sequelize.DATE
            },
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('tiposReportes');
    }
};
