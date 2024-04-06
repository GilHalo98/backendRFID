'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('permisos', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            descripcionPermiso: {
                type: Sequelize.STRING
            },
            autorizacion: {
                type: Sequelize.INTEGER
            },
            fechaRegistroPermiso: {
                type: Sequelize.DATE
            },
    
            fechaModificacionPermiso: {
                type: Sequelize.DATE
            },
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('permisos');
    }
};