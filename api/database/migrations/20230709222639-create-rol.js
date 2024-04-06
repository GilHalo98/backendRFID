'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('roles', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },

            rolTrabajador: {
                type: Sequelize.STRING
            },

            descripcionRol: {
                type: Sequelize.STRING
            },

            fechaRegistroRol: {
                type: Sequelize.DATE
            },

            fechaModificacionRol: {
                type: Sequelize.DATE
            },

            idPermisoVinculado: {
                type: Sequelize.INTEGER,
                required: true,
                allowNull: false,
                onDelete: 'cascade',
                references: {
                    model: {
                        tableName: "permisos",
                    },
                    key: "id",
                },
            },
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('roles');
    }
};