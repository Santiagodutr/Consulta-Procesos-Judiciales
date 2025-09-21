import axios from 'axios';

// Test the judicial consultation API
async function testJudicialAPI() {
  const baseURL = 'http://localhost:8000/api';
  
  console.log('🧪 Testing Judicial Consultation API...\n');
  
  try {
    // Test 1: API Info endpoint
    console.log('1️⃣ Testing API info endpoint...');
    const infoResponse = await axios.get(`${baseURL}/`);
    console.log('✅ API Info:', infoResponse.data);
    console.log();
    
    // Test 2: Public process consultation (with a test number)
    console.log('2️⃣ Testing process consultation endpoint...');
    const testProcessNumber = '11-001-31-03-2024-00123';
    
    try {
      const consultResponse = await axios.post(`${baseURL}/judicial/consult`, {
        numeroRadicacion: testProcessNumber
      });
      console.log('✅ Process consultation successful:', consultResponse.data);
    } catch (consultError: any) {
      if (consultError.response?.status === 404) {
        console.log('ℹ️ Process not found (expected for test number):', consultError.response.data);
      } else {
        console.log('❌ Process consultation error:', consultError.response?.data || consultError.message);
      }
    }
    console.log();
    
    // Test 3: Search endpoint
    console.log('3️⃣ Testing search endpoint...');
    try {
      const searchResponse = await axios.get(`${baseURL}/judicial/search?q=test`);
      console.log('✅ Search successful:', searchResponse.data);
    } catch (searchError: any) {
      console.log('❌ Search error:', searchError.response?.data || searchError.message);
    }
    console.log();
    
    // Test 4: Authentication endpoints
    console.log('4️⃣ Testing authentication...');
    try {
      // Test registration
      const registerResponse = await axios.post(`${baseURL}/auth/register`, {
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        documentType: 'CC',
        documentNumber: '12345678',
        userType: 'abogado'
      });
      console.log('✅ Registration test:', registerResponse.data);
    } catch (regError: any) {
      if (regError.response?.data?.error?.includes('already exists')) {
        console.log('ℹ️ User already exists (expected)');
      } else {
        console.log('❌ Registration error:', regError.response?.data || regError.message);
      }
    }
    console.log();
    
    console.log('🎉 API tests completed!');
    
  } catch (error: any) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run the test
testJudicialAPI();