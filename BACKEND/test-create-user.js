// Script para probar la creación de usuario
const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api'; // Asumiendo puerto 8000 del .env

async function testCreateUser() {
    console.log('🧪 Probando creación de usuario...\n');
    
    const userData = {
        email: `testuser${Date.now()}@example.com`, // Email único
        password: 'TestPassword123!',
        first_name: 'Juan',
        last_name: 'Pérez',
        document_number: `${Date.now().toString().slice(-8)}`, // Número único
        document_type: 'CC',
        user_type: 'natural',
        phone_number: '+573001234567'
    };

    console.log('📝 Datos del usuario a crear:');
    console.log(JSON.stringify(userData, null, 2));
    console.log('\n' + '='.repeat(50) + '\n');

    try {
        // Test 1: Verificar que el servidor esté corriendo
        console.log('1️⃣ Verificando servidor...');
        try {
            await axios.get(`${BASE_URL}/health`);
            console.log('✅ Servidor corriendo\n');
        } catch (error) {
            console.log('⚠️ Endpoint /health no disponible, intentando registro directo...\n');
        }

        // Test 2: Crear usuario
        console.log('2️⃣ Creando usuario...');
        const response = await axios.post(`${BASE_URL}/auth/register`, userData);

        console.log('✅ Usuario creado exitosamente!');
        console.log('📄 Respuesta del servidor:');
        console.log(JSON.stringify(response.data, null, 2));

        // Extraer información importante
        if (response.data.success && response.data.data) {
            const { user, access_token } = response.data.data;
            console.log('\n' + '='.repeat(50));
            console.log('🎉 RESUMEN DEL REGISTRO:');
            console.log('='.repeat(50));
            console.log(`📧 Email: ${user.email}`);
            console.log(`🆔 ID: ${user.id}`);
            console.log(`👤 Nombre: ${user.first_name} ${user.last_name}`);
            console.log(`📄 Documento: ${user.document_type} ${user.document_number}`);
            console.log(`📱 Teléfono: ${user.phone_number}`);
            console.log(`✅ Verificado: ${user.email_verified ? 'Sí' : 'No (revisar email)'}`);
            console.log(`🔑 Token generado: ${access_token ? 'Sí' : 'No'}`);
            console.log('='.repeat(50));

            return {
                success: true,
                user,
                token: access_token
            };
        }

    } catch (error) {
        console.log('❌ Error al crear usuario:');
        
        if (error.response) {
            // Error del servidor
            console.log(`🔴 Status: ${error.response.status}`);
            console.log('📄 Respuesta:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            // Error de conexión
            console.log('🔴 No se pudo conectar al servidor');
            console.log('💡 Asegúrate de que el servidor esté corriendo en:', BASE_URL);
        } else {
            // Otro error
            console.log('🔴 Error:', error.message);
        }

        return { success: false, error: error.message };
    }
}

async function testLogin(email, password) {
    console.log('\n🔐 Probando login...');
    
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email,
            password
        });

        console.log('✅ Login exitoso!');
        console.log('📄 Respuesta:', JSON.stringify(response.data, null, 2));
        
        return response.data;
    } catch (error) {
        console.log('❌ Error en login:');
        if (error.response) {
            console.log('📄 Respuesta:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('🔴 Error:', error.message);
        }
        return null;
    }
}

// Ejecutar pruebas
async function runTests() {
    console.log('🚀 INICIO DE PRUEBAS DE AUTENTICACIÓN');
    console.log('='.repeat(60));
    
    // Crear usuario
    const createResult = await testCreateUser();
    
    if (createResult.success) {
        // Si el usuario se creó, probar login
        const loginData = {
            email: createResult.user.email,
            password: 'TestPassword123!'
        };
        
        await testLogin(loginData.email, loginData.password);
    }
    
    console.log('\n🏁 FIN DE PRUEBAS');
}

// Solo ejecutar si es llamado directamente
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { testCreateUser, testLogin };