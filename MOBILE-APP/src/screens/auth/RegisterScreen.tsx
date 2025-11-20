import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Title } from 'react-native-paper';
import { authAPI } from '../../services/apiService';
import { useNavigation } from '@react-navigation/native';

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentType, setDocumentType] = useState('CC');
  const [userType, setUserType] = useState('natural');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        document_number: documentNumber,
        document_type: documentType,
        user_type: userType,
        phone_number: phoneNumber,
      };

      const res = await authAPI.register(payload);
      if (res && (res as any).success) {
        // after register navigate to Login
        navigation.navigate('Login' as never);
      }
    } catch (err) {
      // apiService shows alerts
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Title style={styles.title}>Registrarse</Title>
      <TextInput label="Email" value={email} onChangeText={setEmail} style={styles.input} />
      <TextInput label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
      <TextInput label="Nombres" value={firstName} onChangeText={setFirstName} style={styles.input} />
      <TextInput label="Apellidos" value={lastName} onChangeText={setLastName} style={styles.input} />
      <TextInput label="Documento" value={documentNumber} onChangeText={setDocumentNumber} style={styles.input} />
      <TextInput label="Tipo Documento (CC/NIT)" value={documentType} onChangeText={setDocumentType} style={styles.input} />
      <TextInput label="Tipo Usuario (natural/juridical)" value={userType} onChangeText={setUserType} style={styles.input} />
      <TextInput label="Teléfono" value={phoneNumber} onChangeText={setPhoneNumber} style={styles.input} />

      <Button mode="contained" onPress={onSubmit} loading={submitting} disabled={submitting} style={styles.button}>
        Crear cuenta
      </Button>
      <Button onPress={() => navigation.navigate('Login' as never)} style={styles.link}>
        Volver a iniciar sesión
      </Button>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, flexGrow: 1, justifyContent: 'center' },
  title: { textAlign: 'center', marginBottom: 12 },
  input: { marginBottom: 10 },
  button: { marginTop: 8 },
  link: { marginTop: 12 },
});

export default RegisterScreen;
