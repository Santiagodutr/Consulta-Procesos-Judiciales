import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';
import apiService, { authAPI } from '../services/apiService';

type User = any | null;

interface AuthContextValue {
	user: User;
	loading: boolean;
	signIn: (email: string, password: string) => Promise<void>;
	signOut: () => Promise<void>;
	refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<User>(null);
	const [loading, setLoading] = useState<boolean>(true);

	useEffect(() => {
		// Initialize auth state from secure storage
		(async () => {
			try {
				const token = await SecureStore.getItemAsync('access_token');
				const refresh = await SecureStore.getItemAsync('refresh_token');

				if (token) {
					// set token on api client
					apiService.setAuthToken(token);

					// try getting profile
					const profileRes = await authAPI.getProfile();
					if (profileRes && profileRes.success && profileRes.data) {
						setUser(profileRes.data);
					} else {
						// try refresh if profile failed but refresh token available
						if (refresh) {
							const refreshed = await refreshSession();
							if (!refreshed) {
								await signOut();
							}
						} else {
							await signOut();
						}
					}
				}
			} catch (err) {
				// ignore and treat as not authenticated
				console.debug('Auth init error', err);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	const signIn = async (email: string, password: string) => {
		setLoading(true);
		try {
			const res = await authAPI.login(email, password);
			if (res && res.success && res.data) {
				const access = (res.data as any).access_token || (res.data as any).accessToken;
				const refresh = (res.data as any).refresh_token || (res.data as any).refreshToken;
				let userData = (res.data as any).user || (res.data as any).userDTO || null;

				if (!access) {
					throw new Error(res.message || 'No access token returned');
				}

				await SecureStore.setItemAsync('access_token', access);
				if (refresh) await SecureStore.setItemAsync('refresh_token', refresh);
				apiService.setAuthToken(access);

				// Try to get profile if not returned
				if (!userData) {
					const profileRes = await authAPI.getProfile();
					if (profileRes && profileRes.success) userData = profileRes.data;
				}

				setUser(userData || null);
			} else {
				throw new Error(res?.message || 'Login failed');
			}
		} catch (error: any) {
			console.error('Login error', error);
			Alert.alert('Login failed', error?.message || 'Unable to login');
			throw error;
		} finally {
			setLoading(false);
		}
	};

	const signOut = async () => {
		setLoading(true);
		try {
			// call backend logout (best-effort)
			try {
				await authAPI.logout();
			} catch (e) {
				// ignore
			}

			await SecureStore.deleteItemAsync('access_token');
			await SecureStore.deleteItemAsync('refresh_token');
			await apiService.clearAuthToken();
			setUser(null);
		} catch (err) {
			console.error('Sign out error', err);
		} finally {
			setLoading(false);
		}
	};

	const refreshSession = async (): Promise<boolean> => {
		try {
			const refreshed = await apiService.refreshToken();
			if (refreshed) {
				const newToken = await SecureStore.getItemAsync('access_token');
				if (newToken) apiService.setAuthToken(newToken);
				// update user profile
				const profileRes = await authAPI.getProfile();
				if (profileRes && profileRes.success) setUser(profileRes.data);
			}
			return refreshed;
		} catch (err) {
			console.error('Refresh session error', err);
			return false;
		}
	};

	return (
		<AuthContext.Provider value={{ user, loading, signIn, signOut, refreshSession }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used within AuthProvider');
	return ctx;
};

export default AuthContext;
