'use strict';
const fecha = new Date();
const bcrypjs = require("bcryptjs");
function passgen() {
    // Realizamos una key para el encriptado.
    const salt = bcrypjs.genSaltSync(10);

    // Encriptamos la contraseña.
    const hash = bcrypjs.hashSync('admin', salt);

    return hash;
};
/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.bulkInsert('empleados', [
            {
                nombres: 'INVALIDO',
                apellidoPaterno: '',
                apellidoMaterno: '',

                numeroTelefonico: '',

                edad: 0,
                fechaNacimiento: fecha,

                fechaRegistroEmpleado: fecha,

                idRolVinculado: 1,
                idImagenVinculada: 1
            },
            {
                nombres: 'ADMON',
                apellidoPaterno: '',
                apellidoMaterno: '',

                numeroTelefonico: '',

                edad: 0,
                fechaNacimiento: fecha,

                fechaRegistroEmpleado: fecha,

                idRolVinculado: 2,
                idImagenVinculada: 1
            },
        ], {});

        await queryInterface.bulkInsert('usuarios', [
            {
                nombreUsuario: 'ADMON',
                password: passgen(),
                fechaRegistroUsuario: fecha,
                idRegistroEmpleadoVinculado: 1
            },
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('empleados', null, {});
        await queryInterface.bulkDelete('usuarios', null, {});
    }
};