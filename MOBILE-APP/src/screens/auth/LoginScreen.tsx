import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Title } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import LoadingIndicator from '../../components/LoadingIndicator';

const LoginScreen: React.FC = () => {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const navigation = useNavigation();

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      // signIn already handles alerts
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingIndicator />;

  return (
    <View style={styles.container}>
      <Title style={styles.title}>Iniciar sesión</Title>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button mode="contained" onPress={onSubmit} loading={submitting} disabled={submitting} style={styles.button}>
        Entrar
      </Button>
      <Button mode="text" onPress={() => navigation.navigate('Register' as never)} style={styles.button}>
        Registrarse
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
  },
});

export default LoginScreen;
