'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('dispositivosIoT', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },

            descripcionDispositivo: {
                type: Sequelize.STRING
            },

            fechaRegistroIoT: {
                type: Sequelize.DATE
            },

            fechaModificacionIoT: {
                type: Sequelize.DATE
            },

            idZonaVinculada: {
                type: Sequelize.INTEGER,
                required: true,
                allowNull: false,
                onDelete: 'cascade',
                references: {
                    model: {
                        tableName: "zonas",
                    },
                    key: "id",
                },
            },

            idTipoDispositivoVinculado: {
                type: Sequelize.INTEGER,
                required: true,
                allowNull: false,
                onDelete: 'cascade',
                references: {
                    model: {
                        tableName: "tiposDispositivos",
                    },
                    key: "id",
                },
            },
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('dispositivosIoT');
    }
};