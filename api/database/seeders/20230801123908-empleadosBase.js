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
                nombres: 'ADMON',
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
                nombres: '',
                apellidoPaterno: 'Hernan',
                apellidoMaterno: 'Cortez',

                numeroTelefonico: '',

                edad: 0,
                fechaNacimiento: fecha,

                fechaRegistroEmpleado: fecha,

                idRolVinculado: 1,
                idImagenVinculada: 1
            },
            {
                nombres: 'Cris',
                apellidoPaterno: '',
                apellidoMaterno: '',

                numeroTelefonico: '',

                edad: 0,
                fechaNacimiento: fecha,

                fechaRegistroEmpleado: fecha,

                idRolVinculado: 2,
                idImagenVinculada: 1
            },
            {
                nombres: 'Armando',
                apellidoPaterno: '',
                apellidoMaterno: '',

                numeroTelefonico: '',

                edad: 0,
                fechaNacimiento: fecha,

                fechaRegistroEmpleado: fecha,

                idRolVinculado: 2,
                idImagenVinculada: 1
            },
            {
                nombres: 'Wero',
                apellidoPaterno: '',
                apellidoMaterno: '',

                numeroTelefonico: '',

                edad: 0,
                fechaNacimiento: fecha,

                fechaRegistroEmpleado: fecha,

                idRolVinculado: 5,
                idImagenVinculada: 1
            },
            {
                nombres: 'Diego Rafael',
                apellidoPaterno: 'Gil',
                apellidoMaterno: 'Meza',

                numeroTelefonico: '',

                edad: 0,
                fechaNacimiento: fecha,

                fechaRegistroEmpleado: fecha,

                idRolVinculado: 1,
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
            {
                nombreUsuario: 'cortez',
                password: passgen(),
                fechaRegistroUsuario: fecha,
                idRegistroEmpleadoVinculado: 2
            },
            {
                nombreUsuario: 'diego',
                password: passgen(),
                fechaRegistroUsuario: fecha,
                idRegistroEmpleadoVinculado: 6
            },
        ], {});
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.bulkDelete('empleados', null, {});
        await queryInterface.bulkDelete('usuarios', null, {});
    }
};