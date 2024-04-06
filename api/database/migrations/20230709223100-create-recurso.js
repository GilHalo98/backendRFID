'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('recursos', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },

            // Propiedades del objeto.
            tipo: {
                type: Sequelize.STRING
            },

            nombre: {
                type: Sequelize.STRING
            },

            data: {
                type: Sequelize.BLOB('long')
            },

            fechaRegistroRecurso: {
                type: Sequelize.DATE
            },

            fechaModificacionRecurso: {
                type: Sequelize.DATE
            }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('recursos');
    }
};