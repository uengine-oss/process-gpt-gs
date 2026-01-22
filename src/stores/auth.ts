import { router } from '@/router';
import { defineStore } from 'pinia';

import StorageBaseFactory from '@/utils/StorageBaseFactory';
const storage = StorageBaseFactory.getStorage();

import BackendFactory from '@/components/api/BackendFactory';
const backend = BackendFactory.createBackend();

export const useAuthStore = defineStore({
    id: 'auth',
    actions: {
        async logout() {
            try {
                await storage?.signOut();
                if (router.currentRoute.value.path === '/') {
                    window.location.reload();
                } else {
                    router.push('/');
                }
            } catch (e) {
                console.log(e);
            }
        },
        async signInWithKeycloak() {
            try {
                
                    var result: any = await storage?.signInWithKeycloak();

                    if (!result.error) {
                        router.push('/definition-map');
                    } else {
                        await (window as any).$app_.try({
                            action: () => Promise.reject(new Error()),
                            errorMsg: result.errorMsg
                        });
                    }
            } catch (e) {
                console.log(e);
            }
        },
        async signIn(email: string, password: string) {
            try {
                if (email && password) {
                    const userInfo: any = {
                        email: email,
                        password: password
                    };
                    var result: any = await storage?.signIn(userInfo);
                    
                    if (result.error) {
                        await (window as any).$app_.try({
                            action: () => Promise.reject(new Error()),
                            errorMsg: result.errorMsg
                        });
                    } else {
                        const tenantId = window.$tenantName;
                        await backend.setTenant(tenantId);
                        router.push(window.$isTenantServer ? '/tenant/manage' : '/definition-map')
                    }
                }
            } catch (e) {
                console.log(e);
            }
        },
        async signUp(username: string, email: string, password: string, proxy: any) {
            try {
                if (username && email && password) {
                    const userInfo: any = {
                        username: username,
                        email: email,
                        password: password
                    };
                    var result: any = await storage?.signUp(userInfo);
        
                    if (result.error) {
                        if(result.errorMsg === 'Email rate limit exceeded'){
                            await (window as any).$app_.try({
                                action: () => Promise.reject(new Error(proxy.$t('auth.emailRateLimitExceeded'))),
                                errorMsg: proxy.$t('auth.emailRateLimitExceeded')
                            });
                        } else if (result.errorMsg === 'User already registered') {
                            await (window as any).$app_.try({
                                action: () => Promise.reject(new Error(proxy.$t('auth.userAlreadyRegistered'))),
                                errorMsg: proxy.$t('auth.userAlreadyRegistered')
                            });
                        } else {
                            await (window as any).$app_.try({
                                action: () => Promise.reject(new Error(result.errorMsg)),
                                errorMsg: result.errorMsg
                            });
                        }
                    } else {
                        const tenantId = window.$tenantName;
                        await backend.setTenant(tenantId);
                        if (result["isNewUser"]) {
                            await (window as any).$app_.try({
                                action: () => Promise.resolve(),
                                successMsg: proxy.$t('auth.verificationEmailSent')
                            });
                            router.push('/auth/login');
                        } else {
                            await (window as any).$app_.try({
                                action: () => Promise.resolve(),
                                successMsg: proxy.$t('auth.registrationSuccess')
                            });
                            router.push('/definition-map');
                        }
                    }
                }
            } catch (e) {
                console.log(e);
            }
        },
        async resetPassword(email: string, proxy: any) {
            try {
                var result: any = await storage?.resetPassword(email);
                if (!result.error) {
                    await (window as any).$app_.try({
                        action: () => Promise.resolve(),
                        successMsg: proxy.$t('auth.emailSent')
                    });
                    router.push('/auth/login');
                }
            } catch (e) {
                console.log(e);
            }
        },
        async updatePassword(password: string, proxy: any) {
            try {
                var result: any = await backend?.updateUser({ password: password });
                if (!result.error) {
                    await (window as any).$app_.try({
                        action: () => Promise.resolve(),
                        successMsg: proxy.$t('auth.passwordUpdated')
                    });
                    router.push('/auth/login');
                }
            } catch (e) {
                console.log(e);
            }
        }
    }
});
