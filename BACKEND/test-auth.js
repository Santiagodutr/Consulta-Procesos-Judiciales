// Test script para probar endpoints de autenticación
// Ejecutar con: node test-auth.js

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/auth';

// Datos de prueba
const testUser = {
  email: 'test@example.com',
  password: 'TestPassword123!',
  first_name: 'Test',
  last_name: 'User',
  document_number: '12345678',
  document_type: 'CC',
  user_type: 'natural',
  phone_number: '+573001234567'
};

let authToken = '';
let refreshToken = '';

async function testRegister() {
  console.log('\n🔵 Probando registro de usuario...');
  
  try {
    const response = await axios.post(`${BASE_URL}/register`, testUser);
    console.log('✅ Registro exitoso:', response.data.message);
    console.log('📧 Usuario creado con ID:', response.data.data.user.id);
    
    // Guardar tokens para siguientes pruebas
    authToken = response.data.data.access_token;
    refreshToken = response.data.data.refresh_token;
    
  } catch (error) {
    console.error('❌ Error en registro:', error.response?.data || error.message);
  }
}

async function testLogin() {
  console.log('\n🔵 Probando login...');
  
  try {
    const response = await axios.post(`${BASE_URL}/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    console.log('✅ Login exitoso:', response.data.message);
    console.log('👤 Usuario:', response.data.data.user.email);
    
    // Actualizar tokens
    authToken = response.data.data.access_token;
    refreshToken = response.data.data.refresh_token;
    
  } catch (error) {
    console.error('❌ Error en login:', error.response?.data || error.message);
  }
}

async function testProfile() {
  console.log('\n🔵 Probando obtener perfil...');
  
  try {
    const response = await axios.get(`${BASE_URL}/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Perfil obtenido exitosamente');
    console.log('👤 Usuario:', response.data.data.first_name, response.data.data.last_name);
    console.log('📧 Email:', response.data.data.email);
    console.log('📄 Documento:', response.data.data.document_number);
    
  } catch (error) {
    console.error('❌ Error obteniendo perfil:', error.response?.data || error.message);
  }
}

async function testUpdateProfile() {
  console.log('\n🔵 Probando actualizar perfil...');
  
  try {
    const response = await axios.put(`${BASE_URL}/profile`, {
      first_name: 'Test Updated',
      phone_number: '+573009876543'
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Perfil actualizado:', response.data.message);
    console.log('📱 Nuevo teléfono:', response.data.data.phone_number);
    
  } catch (error) {
    console.error('❌ Error actualizando perfil:', error.response?.data || error.message);
  }
}

async function testRefreshToken() {
  console.log('\n🔵 Probando refresh token...');
  
  try {
    const response = await axios.post(`${BASE_URL}/refresh-token`, {
      refresh_token: refreshToken
    });
    
    console.log('✅ Token refrescado exitosamente');
    
    // Actualizar tokens
    authToken = response.data.data.access_token;
    refreshToken = response.data.data.refresh_token;
    
  } catch (error) {
    console.error('❌ Error refrescando token:', error.response?.data || error.message);
  }
}

async function testForgotPassword() {
  console.log('\n🔵 Probando forgot password...');
  
  try {
    const response = await axios.post(`${BASE_URL}/forgot-password`, {
      email: testUser.email
    });
    
    console.log('✅ Email de reset enviado:', response.data.message);
    
  } catch (error) {
    console.error('❌ Error en forgot password:', error.response?.data || error.message);
  }
}

async function testLogout() {
  console.log('\n🔵 Probando logout...');
  
  try {
    const response = await axios.post(`${BASE_URL}/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Logout exitoso:', response.data.message);
    
  } catch (error) {
    console.error('❌ Error en logout:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('🚀 Iniciando tests de autenticación...');
  console.log('📡 Base URL:', BASE_URL);
  
  // Esperar un poco para asegurar que el servidor esté corriendo
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Ejecutar tests en secuencia
  await testRegister();
  await testLogin();
  await testProfile();
  await testUpdateProfile();
  await testRefreshToken();
  await testForgotPassword();
  await testLogout();
  
  console.log('\n✨ Tests completados!');
  console.log('\n📝 Notas importantes:');
  console.log('   - Revisa tu email para la confirmación de cuenta');
  console.log('   - Revisa tu email para el reset de contraseña');
  console.log('   - Los tokens JWT tienen una duración de 7 días');
}

// Ejecutar tests
runTests().catch(error => {
  console.error('💥 Error general:', error.message);
  process.exit(1);
});