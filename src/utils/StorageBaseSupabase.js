import { getBaseDomain, getMainDomainUrl } from './domainUtils.js';

class StorageBaseError extends Error {
    constructor(message, cause, args) {
        super(message, { cause: cause });

        this.args = args;
    }
}

export default class StorageBaseSupabase {
    //extends StorageBase{

    async recordAuthAudit({ action, email, success, errorMessage, tenantId, metadata }) {
        try {
            const supabase = window.$supabase;
            if (!supabase || typeof supabase.rpc !== 'function') return;

            await supabase.rpc('record_auth_audit', {
                p_action: action,
                p_email: email ?? null,
                p_success: Boolean(success),
                p_error_message: errorMessage ?? null,
                p_tenant_id: tenantId ?? null,
                p_metadata: metadata ?? {}
            });
        } catch (e) {
            // 감사 로그 기록 실패는 UX를 깨지 않도록 조용히 무시 (콘솔만)
            console.warn('[auth_login_audit] 기록 실패:', e);
        }
    }

    async isConnection() {
        try {
            // 먼저 현재 세션 상태를 확인
            const { data: currentSession, error: sessionError } = await window.$supabase.auth.getSession();
            
            // 세션이 유효한 경우
            if (!sessionError && currentSession.session && currentSession.session.user) {
                this.writeUserData(currentSession);
                return true;
            }

            // 세션이 없거나 만료된 경우, 저장된 토큰으로 복구 시도
            let accessToken = "";
            let refreshToken = "";
            
            // Check if we're in webview mode
            if (window.AndroidBridge) {
                try {
                    const sessionTokenStr = window.AndroidBridge.getSessionToken();
                    if (sessionTokenStr) {
                        const sessionTokens = JSON.parse(sessionTokenStr);
                        accessToken = sessionTokens.access_token || "";
                        refreshToken = sessionTokens.refresh_token || "";
                    }
                } catch (e) {
                    console.error('Error parsing session tokens:', e);
                    accessToken = "";
                    refreshToken = "";
                }
            } else {
                if (document.cookie && document.cookie.includes('; ')) {
                    accessToken = document.cookie.split('; ').find(row => row.startsWith('access_token'))?.split('=')[1];
                    refreshToken = document.cookie.split('; ').find(row => row.startsWith('refresh_token'))?.split('=')[1];
                }
            }

            // 저장된 토큰이 있는 경우 세션 복구 시도
            if (accessToken && refreshToken && accessToken.length > 0 && refreshToken.length > 0) {
                try {
                    const { error: setSessionError } = await window.$supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken
                    });

                    if (setSessionError) {
                        console.log('setSession failed, attempting refresh:', setSessionError.message);
                        // setSession이 실패한 경우 refresh 시도
                        await this.refreshSession();
                    }
                } catch (setSessionErr) {
                    console.log('setSession exception, attempting refresh:', setSessionErr.message);
                    await this.refreshSession();
                }
            } else {
                // 저장된 토큰이 없는 경우 refresh 시도
                await this.refreshSession();                
            }
            
            // 최종 세션 상태 확인
            const { data: finalSession, error: finalError } = await window.$supabase.auth.getSession();
            if (finalError || !finalSession.session) {
                return false;
            }

            if (finalSession.session && finalSession.session.user) {
                this.writeUserData(finalSession);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error checking Supabase connection:', error);
            return false;
        }
    }

    async refreshSession() {
        try {
            const { data: refreshData, error: refreshError } = await window.$supabase.auth.refreshSession();

            if (refreshError) {
                console.error('Error refreshing session:', refreshError);
                
                // refresh_token_already_used 오류인 경우 특별 처리
                if (refreshError.message && refreshError.message.includes('refresh_token_already_used')) {
                    console.log('Refresh token already used, clearing session and redirecting to login');
                    await this.clearSession();
                    return;
                }
                
                // 기타 refresh 오류인 경우 세션 클리어
                await this.clearSession();
            } else if (refreshData && refreshData.session) {
                // Refresh 성공한 경우 새 토큰 저장
                // Check if we're in webview mode
                if (window.AndroidBridge) {
                    console.log("refreshSession - webview mode");
                    window.AndroidBridge.saveSessionToken(
                        refreshData.session.access_token,
                        refreshData.session.refresh_token
                    );
                    console.log("refreshSession - webview mode - saveSessionToken", refreshData.session.access_token, refreshData.session.refresh_token);
                } else {
                    const baseDomain = getBaseDomain();
                    if (baseDomain.includes('process-gpt')) {
                        document.cookie = `access_token=${refreshData.session.access_token}; domain=.${baseDomain}; path=/; Secure; SameSite=Lax`;
                        document.cookie = `refresh_token=${refreshData.session.refresh_token}; domain=.${baseDomain}; path=/; Secure; SameSite=Lax`;
                    } else {
                        document.cookie = `access_token=${refreshData.session.access_token}; path=/; SameSite=Lax`;
                        document.cookie = `refresh_token=${refreshData.session.refresh_token}; path=/; SameSite=Lax`;
                    }
                }
                window.localStorage.setItem('accessToken', refreshData.session.access_token);
            }
        } catch (e) {
            console.error('Error in refreshSession:', e);
            // 예외 발생 시에도 세션 클리어
            await this.clearSession();
        }
    }

    async clearSession() {
        try {
            const cookieOptionsBase = `path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
            
            // Check if we're in webview mode
            if (window.AndroidBridge) {
                window.AndroidBridge.clearSession();
            } else {
                const baseDomain = getBaseDomain();
                if (baseDomain.includes('process-gpt')) {
                    document.cookie = `access_token=; domain=.${baseDomain}; ${cookieOptionsBase}; Secure`;
                    document.cookie = `refresh_token=; domain=.${baseDomain}; ${cookieOptionsBase}; Secure`;
                } else {
                    document.cookie = `access_token=; ${cookieOptionsBase}`;
                    document.cookie = `refresh_token=; ${cookieOptionsBase}`;
                }
            }
            window.localStorage.removeItem('accessToken');
        } catch (e) {
            console.error('Error clearing session:', e);
        }
    }

    async checkTenantOwner(tenantId) {
        try {
            const data = await this.getObject(`tenants/${tenantId}`, { key: 'id' });
            if (data && data.owner) {
                const user = await this.getUserInfo();
                if (data.owner == user.uid) {
                    return true;
                }
            } else {
                return false;
            }
        } catch (e) {
            throw new StorageBaseError('error in checkTenantOwner', e, arguments);
        }
    }

    async signIn(userInfo) {
        try {
            const filter = { match: { email: userInfo.email } }
            if (window.$tenantName) {
                filter.match.tenant_id = window.$tenantName;
            }
            const existUser = await this.getObject('users', filter);
            if ((window.$isTenantServer && !window.$tenantName) || (existUser && existUser.id)) {
                const result = await window.$supabase.auth.signInWithPassword({
                    email: userInfo.email,
                    password: userInfo.password
                });

                if (!result.error) {
                    // 로그인 성공
                    return result.data;
                } else if (result.error && result.error.message.includes("Email not confirmed")){
                    await this.recordAuthAudit({
                        action: 'login',
                        email: userInfo.email,
                        success: false,
                        errorMessage: result.error.message,
                        tenantId: window.$tenantName || null,
                        metadata: { method: 'password', reason: 'email_not_confirmed' }
                    });
                    // 계정 인증이 완료 되지 않았습니다. 메시지 출력 부분
                    await window.$app_.try({
                        action: () => Promise.reject(new Error()),
                        errorMsg: window.$i18n.global.t('StorageBaseSupabase.emailNotConfirmed')
                    });
                    return {
                        error: true
                    };
                } else {
                    await this.recordAuthAudit({
                        action: 'login',
                        email: userInfo.email,
                        success: false,
                        errorMessage: result.error?.message || 'login_failed',
                        tenantId: window.$tenantName || null,
                        metadata: { method: 'password' }
                    });
                    const users = await this.list('users');
                    if (users && users.length > 0) {
                        const checkedId = users.some((user) => user.email == userInfo.email);
                        if (checkedId) {
                            // 비밀번호가 틀렸습니다 메시지 출력 부분
                            await window.$app_.try({
                                action: () => Promise.reject(new Error()),
                                errorMsg: window.$i18n.global.t('StorageBaseSupabase.wrongPassword')
                            });
                        } else {
                            // 아이디가 틀렸습니다 메시지 출력 부분
                            await window.$app_.try({
                                action: () => Promise.reject(new Error()),
                                errorMsg: window.$i18n.global.t('StorageBaseSupabase.wrongId')
                            });
                        }
                        return {
                            error: true
                        };
                    } else {
                        throw new StorageBaseError(result.error);
                    }
                }
            } else {
                await this.recordAuthAudit({
                    action: 'login',
                    email: userInfo.email,
                    success: false,
                    errorMessage: 'not_registered_email',
                    tenantId: window.$tenantName || null,
                    metadata: { method: 'password', reason: 'not_registered_email' }
                });
                // 가입된 이메일이 아닐때 메시지 출력부분
                await window.$app_.try({
                    action: () => Promise.reject(new Error()),
                    errorMsg: window.$i18n.global.t('StorageBaseSupabase.notRegisteredEmail')
                });
                return {
                    error: true
                };
            }
        } catch (e) {
            throw new StorageBaseError('error in signIn', e, arguments);
        }
    }
    async signInWithKeycloak() {
        try {
            const { data, error } = await window.$supabase.auth.signInWithOAuth({
                provider: 'keycloak',
                options: {
                    scopes: 'openid'
                }
            });

            // OAuth는 리다이렉트 기반이라 여기서 “최종 성공/실패”를 알 수 없고,
            // 대신 시도 시작/실패만 기록한다. (최종 성공은 SIGNED_IN 이벤트에서 기록)
            if (error) {
                await this.recordAuthAudit({
                    action: 'login_oauth',
                    email: null,
                    success: false,
                    errorMessage: error.message,
                    tenantId: window.$tenantName || null,
                    metadata: { provider: 'keycloak' }
                });
            } else {
                await this.recordAuthAudit({
                    action: 'login_oauth',
                    email: null,
                    success: true,
                    errorMessage: null,
                    tenantId: window.$tenantName || null,
                    metadata: { provider: 'keycloak' }
                });
            }
        } catch (e) {
            throw new StorageBaseError('error in signInWithKeycloak', e, arguments);
        }
    }
    async signUp(userInfo) {
        try {
            const tenantId = window.$tenantName || 'process-gpt';
            const existUser = await this.getObject('users', { match: { email: userInfo.email, tenant_id: tenantId } });
            if (existUser && existUser.id) {
                return {
                    error: true,
                    errorMsg: '이미 가입된 이메일입니다.'
                };
                // const isOwner = await this.checkTenantOwner(window.$tenantName);
                // const role = isOwner ? 'superAdmin' : 'user';
                // const isAdmin = isOwner ? true : false;
                // await this.putObject('users', {
                //     id: existUser.id,
                //     username: userInfo.username,
                //     email: userInfo.email,
                //     role: role,
                //     is_admin: isAdmin,
                //     tenant_id: tenantId
                // }, { onConflict: 'id' });
                // return await this.signIn(userInfo);
            } else {
                const result = await window.$supabase.auth.signUp({
                    email: userInfo.email,
                    password: userInfo.password,
                    options: {
                        data: {
                            name: userInfo.username
                        },
                        emailRedirectTo: window.location.origin
                    }
                });

                if (!result.error) {
                    if (!window.$isTenantServer && window.$tenantName) {
                        let role = 'user';
                        let isAdmin = false;
                        const existTenant = await this.getObject('tenants', { match: { id: window.$tenantName } });
                        if (!existTenant) {
                            await this.putObject('tenants', {
                                id: window.$tenantName,
                                owner: result.data.user.id
                            });
                            role = 'superAdmin';
                            isAdmin = true;
                        }
                        await this.putObject('users', {
                            id: result.data.user.id,
                            username: userInfo.username,
                            email: userInfo.email,
                            role: role,
                            is_admin: isAdmin,
                            tenant_id: window.$tenantName
                        });
                    } else {
                        await this.putObject('users', {
                            id: result.data.user.id,
                            username: userInfo.username,
                            email: userInfo.email,
                            role: 'user',
                            is_admin: false,
                            tenant_id: 'process-gpt'
                        });
                    }
                    result.data["isNewUser"] = true;
                    return result.data;
                } else {
                    result.errorMsg = result.error.message;
                    return result;
                }
            }
        } catch (e) {
            throw new StorageBaseError('error in signUp', e, arguments);
        }
    }

    async signOut() {
        try {
            // 가능한 한 인증된 상태에서 로그아웃 시각을 먼저 기록
            const auditEmail = window.localStorage.getItem('email');
            await this.recordAuthAudit({
                action: 'logout',
                email: auditEmail,
                success: true,
                errorMessage: null,
                tenantId: window.$tenantName || null,
                metadata: { source: 'StorageBaseSupabase.signOut' }
            });

            window.localStorage.removeItem('accessToken');
            window.localStorage.removeItem('author');
            window.localStorage.removeItem('userName');
            window.localStorage.removeItem('email');
            window.localStorage.removeItem('picture');
            window.localStorage.removeItem('uid');
            window.localStorage.removeItem('isAdmin');
            window.localStorage.removeItem('execution');
            window.localStorage.removeItem('role');
            
            // Check if we're in webview mode
            if (window.AndroidBridge) {
                window.AndroidBridge.clearSession();
            } else {
                const baseDomain = getBaseDomain();
                if (baseDomain.includes('process-gpt')) {
                    document.cookie = `access_token=; domain=.${baseDomain}; path=/`;
                    document.cookie = `refresh_token=; domain=.${baseDomain}; path=/`;
                } else {
                    document.cookie = 'access_token=; path=/';
                    document.cookie = 'refresh_token=; path=/';
                }
            }

            return await window.$supabase.auth.signOut();
        } catch (e) {
            throw new StorageBaseError('error in signOut', e, arguments);
        }
    }

    async getUserInfo() {
        try {
            if (await this.isConnection()) {
                const userData = await window.$supabase.auth.getUser();
                if (userData.error) {
                    throw new StorageBaseError('error in getUserInfo', userData.error, arguments);
                } else if (userData.data.user) {
                    const uid = userData.data.user.id;
                    const filter = { id: uid }   
                    if (window.$tenantName) {
                        filter.tenant_id = window.$tenantName;
                    }
                    
                    // 테넌트가 없는 경우 여러 결과가 나올 수 있으므로 항상 limit(1) 사용
                    var { data, error } = await window.$supabase.from('users')
                        .select()
                        .match(filter)
                        .limit(1);
                    
                    if (!error && data && data.length > 0) {
                        const userData = data[0];
                        return {
                            email: userData.email,
                            name: userData.username,
                            profile: userData.profile,
                            uid: userData.id,
                            role: userData.role,
                            tenant_id: userData.tenant_id
                        }
                    } else if (error) {
                        throw new StorageBaseError('error in getUserInfo', error, arguments);
                    }
                }
            } else {
                // 루트 페이지('/')에서는 로그인 체크를 하지 않음
                if (window.location.pathname === '/') {
                    return null;
                }
                
                if (window.location.pathname != '/auth/login') {
                    await window.$app_.try({
                        action: () => Promise.reject(new Error()),
                        // errorMsg: window.$i18n.global.t('StorageBaseSupabase.loginRequired')
                    });
                    window.location.href = '/auth/login';
                }
            }
        } catch (e) {
            if (e instanceof StorageBaseError && e.cause) {
                console.error('Error in getUserInfo:', e.cause);
            } else {
                console.error('Unexpected error in getUserInfo:', e);
            }
            throw new StorageBaseError('error in getUserInfo', e, arguments);
        }
    }

    async resetPassword(email) {
        try {
            const baseDomain = getBaseDomain();
            let url;
            if (baseDomain.includes('process-gpt')) {
                url = getMainDomainUrl('/auth/reset-password');
            } else {
                url = window.location.origin + '/auth/reset-password';
            }
            const result = await window.$supabase.auth.resetPasswordForEmail(email, {
                redirectTo: url,
            });
            return result;
        } catch (e) {
            throw new StorageBaseError('error in resetPassword', e, arguments);
        }
    }

    async getString(path, options) {
        try {
            let obj = this.formatDataPath(path, options);
            const column = options.column ? options.column : "*";
            if (options && options.match) {
                const { data, error } = await window.$supabase
                    .from(obj.table)
                    .select(column)
                    .match(options.match)
                    .maybeSingle()

                if (error) {
                    return error;
                } else if (data) {
                    if (column != "*") {
                        return data[column];
                    } else {
                        return data;
                    }
                }
            } else if (obj.searchVal) {
                const { data, error } = await window.$supabase
                    .from(obj.table)
                    .select(column)
                    .eq(obj.searchKey, obj.searchVal)
                    .maybeSingle()

                if (error) {
                    return error;
                } else if (data) {
                    if (column != "*") {
                        return data[column];
                    } else {
                        return data;
                    }
                }
            } else {
                const { data, error } = await window.$supabase
                    .from(obj.table)
                    .select(column)
                    .maybeSingle()

                if (error) {
                    return error;
                } else if (data) {
                    if (column != "*") {
                        return data[column];
                    } else {
                        return data;
                    }
                }
            }
        } catch (error) {
            if (error.code === 'PGRST116' || error.code === '42703') {
                console.log(error.message);
                return "";
            }
            throw new StorageBaseError('error in getString', error, arguments)
        }
    }

    async getObject(path, options) {
        try {
            let obj = this.formatDataPath(path, options);
            if (options && options.match) {
                const { data, error } = await window.$supabase
                    .from(obj.table)
                    .select()
                    .match(options.match)
                    .maybeSingle()

                if (error) {
                    return error;
                } else if (data) {
                    return data;
                }
            } else if (obj.searchVal) {
                const { data, error } = await window.$supabase
                    .from(obj.table)
                    .select()
                    .eq(obj.searchKey, obj.searchVal)
                    .maybeSingle()

                if (error) {
                    return error;
                } else if (data) {
                    return data;
                }
            } else {
                const { data, error } = await window.$supabase
                    .from(obj.table)
                    .select()
                    .maybeSingle()

                if (error) {
                    return error;
                } else if (data) {
                    return data;
                }
            }
        } catch (error) {
            if (error.code === 'PGRST116' || error.code === '42703') {
                console.log(error.message);
                return {};
            } else {
                throw new StorageBaseError('error in getObject', error.message)
            }
        }
    }

    // PUT
    async putString(path, value, options) {
        try {
            let obj = this.formatDataPath(path, options);
            if (options && options.match) {
                const { error } = await window.$supabase.from(obj.table).upsert(value).match(options.match);

                if (error) {
                    throw new StorageBaseError('error in putString' + error.message, error, arguments);
                }
            } else if (options && options.onConflict) {
                const { error } = await window.$supabase.from(obj.table).upsert(value, { onConflict: options.onConflict });
                if (error) {
                    throw new StorageBaseError('error in putString' + error.message, error, arguments);
                }
            } else if (obj.searchVal) {
                const { error } = await window.$supabase.from(obj.table).upsert(value).eq(obj.searchKey, obj.searchVal);

                if (error) {
                    throw new StorageBaseError('error in putString' + error.message, error, arguments);
                }
            } else {
                const { error } = await window.$supabase.from(obj.table).upsert(value);

                if (error) {
                    throw new StorageBaseError('error in putString' + error.message, error, arguments);
                }
            }
        } catch (error) {
            throw new StorageBaseError('error in putString', error, arguments);
        }
    }

    async putObject(path, value, options) {
        try {
            let obj = this.formatDataPath(path, options);
            let result;
            if (options && options.match) {
                result = await window.$supabase.from(obj.table).upsert(value).match(options.match);
            } else if (options && options.onConflict) {
                result = await window.$supabase.from(obj.table).upsert(value, { onConflict: options.onConflict });
            } else if (obj.searchVal) {
                result = await window.$supabase.from(obj.table).upsert(value).eq(obj.searchKey, obj.searchVal);
            } else {
                result = await window.$supabase.from(obj.table).upsert(value);

            }

            const { error, status, statusText } = result
            if (status != 200 && error) {
                throw new StorageBaseError('error in putObject:' + status + " " + statusText + " " + error.message, error, arguments);
            }
            return result;
        } catch (error) {
            throw new StorageBaseError('error in putObject', error, arguments);
        }
    }

    // PUSH
    async pushString(path, value, options) {
        try {
            let obj = this.formatDataPath(path, options);
            if (options && options.match) {
                const { error } = await window.$supabase.from(obj.table).upsert(value).match(options.match);

                if (error) {
                    throw new StorageBaseError('error in pushString', error, arguments);
                }
            } else if (obj.searchVal) {
                const { error } = await window.$supabase.from(obj.table).upsert(value).eq(obj.searchKey, obj.searchVal);

                if (error) {
                    throw new StorageBaseError('error in pushString', error, arguments);
                }
            } else {
                const { error } = await window.$supabase.from(obj.table).upsert(value);

                if (error) {
                    throw new StorageBaseError('error in pushString', error, arguments);
                }
            }
        } catch (error) {
            throw new Error('error in pushString', { cause: error, args: arguments });
        }
    }

    async pushObject(path, value, options) {
        try {
            let obj = this.formatDataPath(path, options);
            if (options && options.match) {
                const { error } = await window.$supabase.from(obj.table).upsert(value).match(options.match);

                if (error) {
                    throw new StorageBaseError('error in pushObject', error, arguments);
                }
            } else if (obj.searchVal) {
                const { error } = await window.$supabase.from(obj.table).upsert(value).eq(obj.searchKey, obj.searchVal);

                if (error) {
                    throw new StorageBaseError('error in pushObject', error, arguments);
                }
            } else {
                const { error } = await window.$supabase.from(obj.table).upsert(value);

                if (error) {
                    throw new StorageBaseError('error in pushObject', error, arguments);
                }
            }
        } catch (error) {
            throw new StorageBaseError('error in pushObject', error, arguments);
        }
    }

    // DELETE
    async delete(path, options) {
        try {
            let obj = this.formatDataPath(path, options);
            if (options && options.match) {
                const { error, status, statusText } = await window.$supabase
                    .from(obj.table)
                    .delete()
                    .match(options.match);

                if (error && status != 200) {
                    throw new StorageBaseError('error in delete ' + status + " " + statusText, error, arguments);
                }
            } else if (obj.searchVal) {
                const { error, status, statusText } = await window.$supabase.from(obj.table).delete().eq(obj.searchKey, obj.searchVal);

                if (error && status != 200) {
                    throw new StorageBaseError('error in delete ' + status + " " + statusText, error, arguments);
                }
            }

            return false;
        } catch (error) {
            throw new StorageBaseError('error in delete', error, arguments);
        }
    }
    
    async _watch_off(ref) {   
        return await ref.unsubscribe();
    }

    async _watch(options, callback) {         
        /*
            options: {
                channel: 'custom-channel', // 채널명
                type: 'postgres_changes', // 이벤트 타입
                event: '*', // 이벤트명
                schema: 'public', // 스키마명
                table: 'users' // 테이블명
            }
        */
        let ref = window.$supabase;
        // 채널 설정
        const channelName = options.channel || 'custom-channel';
        ref = ref.channel(channelName);
       
        // 이벤트 타입 지정 
        const eventType = options.type || 'postgres_changes';
        /* 
            'postgres_changes': Postgres 테이블의 INSERT, UPDATE, DELETE 등 데이터 변경 감지
            'broadcast': 같은 채널에 연결된 클라이언트끼리 메시지를 주고받을 때 사용 (실시간 채팅, 알림, 커스텀 이벤트 등에 활용)
            'presence': 같은 채널에 접속한 사용자들의 접속/이탈 상태(접속자 목록, 온라인/오프라인 등)를 실시간으로 감지
        */

        // 이벤트 옵션
        let eventOptions = {};
        if (eventType === 'postgres_changes') {
            eventOptions = {
                event: options.event || '*', // INSERT, UPDATE, DELETE, *
                schema: options.schema || 'public',
                table: options.table,     
                filter: options.filter
            };
        } else if (eventType === 'broadcast') {
            eventOptions = {
                event: options.event || 'message'
            };
        } else if (eventType === 'presence') {
            eventOptions = {
                event: options.event || 'sync'
            };
        }
       
        ref = ref.on(
            eventType,
            eventOptions,
            (payload) => {
                callback(payload);
            }
        );
        await ref.subscribe();

        return ref;
    }

    async watch(path, channel, callback, options = {}) {
        try {
            let obj = this.formatDataPath(path);
            let watchOptions = {
                event: '*',
                schema: 'public',
                table: obj.table,
            }

            // 기존 chats 테이블 필터링 로직
            if (obj.table === 'chats' && path.startsWith('db://chats/')) {
                obj.chatRoomIds = path.split('/')[3];
                watchOptions.filter = obj.chatRoomIds ? `` : null;
            }
            
            // 새로운 필터 옵션 지원
            if (options.filter) {
                watchOptions.filter = options.filter;
            }
            
            const subscription = await window.$supabase
                .channel(channel)
                .on('postgres_changes', watchOptions, (payload) => {
                    // console.log('Change received!', payload);
                    callback(payload);
                })
                .subscribe((status) => {
                    if (options.onStatusChange) {
                        options.onStatusChange(status);
                    }
                });

            return subscription;
        } catch (error) {
            throw new StorageBaseError('error in watch', error, arguments);
        }
    }

    async watch_added(path, callback) {
        try {
            let obj = this.formatDataPath(path);
            await window.$supabase
                .channel('room1')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: obj.table
                    },
                    (payload) => {
                        // console.log('Change received!', payload);
                        callback(payload);
                    }
                )
                .subscribe();
        } catch (error) {
            throw new StorageBaseError('error in watch_added', error, arguments);
        }
    }

    async unwatch(path) {
        try {
            let obj = this.formatDataPath(path);
            const subscription = window.$supabase
                .channel('room1')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: obj.table
                    },
                    (payload) => {
                        console.log('Change received!', payload);
                    }
                );

            await subscription.unsubscribe();

            console.log(`Unsubscribed from changes on ${obj.table}`);
        } catch (error) {
            throw new StorageBaseError('error in unwatch', error, arguments);
        }
    }

    async list(path, options) {
        try {
            // options: {
            //     key: 'key:value' // default key:'orderBy:Field'  First filtering
            //     sort: "desc", // default "asc"
            //     orderBy: 'when',
            //     size: 10,
            //     startAt: orderBy key contains values
            //     endAt: orderBy key contains values
            //     startAfter:  orderBy key then value
            //     endBefore: orderBy key then value
            //     snapshot: true // return snapshot
            // }

            if (!options) options = {};
            const orderByField = options.orderBy || 'id';
            const isAscending = !options.sort || !options.sort.includes('desc');
            let query = window.$supabase

            if(path) {
                query = query.from(path);
            } else {
                query = query.from();
            }

            // key 처리 - 컬럼명
            if (options.key) {
                query = query.select(options.key);
            } else {
                query = query.select();
            }

            // orderBy 처리
            if (options.orderBy) {
                query = query.order(orderByField, { ascending: isAscending });
            }

            /* 
                gt: >
                gte: >=
                lt: <
                lte: <=
                eq: == 

                startAt: >=
                startAfter: >
                endAt: <=
                endBefore: <
                
            */
            // 범위 쿼리 처리
            if (options.startAt && !options.endAt && !options.endBefore) {
                query = query.gte(orderByField, options.startAt);
            } else if (options.startAt && options.endAt) {
                if (options.startAt == options.endAt) {
                    query = query.eq(orderByField, options.startAt);
                } else {
                    query = query.gte(orderByField, options.startAt).lte(orderByField, options.endAt);
                }
            } else if (options.endAt && !options.startAt && !options.startAfter) {
                query = query.lte(orderByField, options.endAt);
            } else if (options.startAfter && !options.endBefore && !options.endAt) {
                query = query.gt(orderByField, options.startAfter);
            } else if (options.startAfter && options.endBefore) {
                if (options.startAfter == options.endBefore) {
                    query = query.eq(orderByField, options.startAfter);
                } else {
                    query = query.gt(orderByField, options.startAfter).lt(orderByField, options.endBefore);
                }
            } else if (options.endBefore && !options.startAfter && !options.startAt) {
                query = query.lt(orderByField, options.endBefore);
            } else if (options.startAt && options.endBefore && !options.endAt) {
                query = query.gte(orderByField, options.startAt).lt(orderByField, options.endBefore);
            } else if (options.startAfter && options.endAt && !options.startAt) {
                query = query.gt(orderByField, options.startAfter).lte(orderByField, options.endAt);
            }

            // like 처리
            if (options.like) {
                query = query.like(options.like.key, options.like.value);
            }

            // 일치 처리
            if (options.match) {
                query = query.match(options.match);
            }

            if (options.inArray) {
                query = query.in(options.inArray.column, options.inArray.values);
            }
            // Add match condition for text[] type column
            if (options.matchArray) {
                query = query.contains(options.matchArray.column, options.matchArray.values);
            }

            if(options.not) {
                query = query.not(options.not.key, options.not.operator, options.not.value);
            }
            if(options.maybeSingle) {
                query = query.maybeSingle()
            }
            // size 처리
            if (options.size) {
                query = query.limit(options.size);
            }

            if(options.range) {
                query = query.range(options.range.from, options.range.to);
            }

            const { data, error } = await query;
            if (error) {
                return error;
            } else {
                return data;
            }
        } catch (error) {
            throw new StorageBaseError('error in list', error, arguments);
        }
    }

    async callProcedure(procedure, params) {
        try {
            const { data, error } = await window.$supabase.rpc(procedure, params);
    
            if (error) {
                console.error('Error calling function:', error);
                return null;
            }
    
            return data;
        } catch (error) {
            console.error('Error in callProcedure:', error);
            return error;
        }
    }
    
    async writeUserData(value, userInfo) {
        try {
            if (value.session) {
                window.localStorage.setItem('accessToken', value.session.access_token);
                
                // Check if we're in webview mode
                if (window.AndroidBridge) {
                    window.AndroidBridge.saveSessionToken(
                        value.session.access_token,
                        value.session.refresh_token
                    );
                } else {
                    const baseDomain = getBaseDomain();
                    if (baseDomain.includes('process-gpt')) {
                        document.cookie = `access_token=${value.session.access_token}; domain=.${baseDomain}; path=/; Secure; SameSite=Lax`;
                        document.cookie = `refresh_token=${value.session.refresh_token}; domain=.${baseDomain}; path=/; Secure; SameSite=Lax`;
                    } else {
                        document.cookie = `access_token=${value.session.access_token}; path=/; SameSite=Lax`;
                        document.cookie = `refresh_token=${value.session.refresh_token}; path=/; SameSite=Lax`;
                    }
                }
            }
            if (value.session.user) {
                window.localStorage.setItem('author', value.session.user.email);
                window.localStorage.setItem('uid', value.session.user.id);

                let filter = { id: value.session.user.id };
                if (window.$tenantName) {
                    filter.tenant_id = window.$tenantName;
                }
                const { data, error } = await window.$supabase
                    .from('users')
                    .select('*')
                    .match(filter)
                    .maybeSingle();

                if (!error) {
                    window.localStorage.setItem('isAdmin', data.is_admin || false);
                    window.localStorage.setItem('picture', data.profile || '');
                    if (data.role && data.role !== '') {
                        window.localStorage.setItem('role', data.role);
                    }
                    window.localStorage.setItem('userName', data.username || '');
                    window.localStorage.setItem('email', data.email || '');
                    window.localStorage.setItem('uid', data.id || '');

                    // FCM 토큰 처리 - user_devices 테이블 사용
                    let fcm_token;
                    
                    // Check if we're in webview mode
                    if (window.AndroidBridge) {
                        // Get FCM token from Android bridge
                        try {
                            fcm_token = window.AndroidBridge.getFcmToken();
                        } catch (e) {
                            console.log('Failed to get FCM token from AndroidBridge:', e);
                            fcm_token = null;
                        }
                    }
                    
                    const userEmail = data.email || '';
                    
                    // user_devices 테이블에서 해당 유저 정보 확인
                    if(userEmail) {
                        const { data: deviceData, error: deviceError } = await window.$supabase
                        .from('user_devices')
                        .select('*')
                        .eq('user_email', userEmail)
                        .maybeSingle();
                        
                        if (deviceError && deviceError.code !== 'PGRST116') {
                            console.error('user_devices 테이블 조회 오류:', deviceError);
                        } else if (!deviceData) {
                            // 해당 유저 정보가 없으면 새로 생성 (device_token은 null로 설정)
                            await window.$supabase
                                .from('user_devices')
                                .insert({
                                    user_email: userEmail,
                                    device_token: null
                                });
                            console.log('user_devices 테이블에 새 유저 정보 생성:', userEmail);
                        }
                        
                        // FCM 토큰이 있고, 기존 토큰과 다르면 업데이트
                        if (fcm_token && (!deviceData?.device_token || deviceData.device_token !== fcm_token)) {
                            await window.$supabase
                                .from('user_devices')
                                .update({ device_token: fcm_token })
                                .eq('user_email', userEmail);
                            console.log('user_devices 테이블에 FCM 토큰 업데이트:', fcm_token);
                        }
                    }
                    

                    if(data && data.is_admin) {
                        const event = new CustomEvent('localStorageChange', { detail: { key: "isAdmin", value: data.is_admin } });
                        window.dispatchEvent(event);
                    }
                }
            }
        } catch (e) {
            throw new StorageBaseError('error in writeUserData', e, arguments);
        }
    }

    formatDataPath(path, options) {
        try {
            path = path.includes('://') ? path.split('://')[1] : path;
            let obj = {
                table: ''
            };

            if (path.includes('/')) {
                obj.table = path.split('/')[0];
                if (options && options.key) {
                    obj.searchKey = options.key;
                    obj.searchVal = path.split('/')[1];
                }
            } else {
                obj.table = path;
            }

            return obj;
        } catch (error) {
            throw new StorageBaseError('error in formatDataPath', error, arguments);
        }
    }

    async getCount(path, options) {
        try {
            let obj = this.formatDataPath(path, options);
            if (options && options.match) {
                const { count, error } = await window.$supabase.from(obj.table).select('*', { count: 'exact' }).match(options.match);

                if (error) {
                    return error;
                } else {
                    return count;
                }
            } else if (obj.searchVal) {
                const { count, error } = await window.$supabase
                    .from(obj.table)
                    .select('*', { count: 'exact' })
                    .eq(obj.searchKey, obj.searchVal);

                if (error) {
                    return error;
                } else {
                    return count;
                }
            } else {
                const { count, error } = await window.$supabase.from(obj.table).select('*', { count: 'exact' });

                if (error) {
                    return error;
                } else {
                    return count;
                }
            }
        } catch (error) {
            throw new StorageBaseError('error in getCount', error, arguments);
        }
    }

    async callProcedure(procedure, params) {
        try {
            const { data, error } = await window.$supabase.rpc(procedure, params);

            if (error) {
                console.error('Error calling function:', error);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Error in callProcedure:', error);
            return error;
        }
    }

    async search(keyword) {
        let results = [];
        if (window.$jms || window.$pal) {
            results = await Promise.all([
                this.searchProcDef(keyword)
            ]);
        } else {
            results = await Promise.all([
                this.searchProcInst(keyword),
                this.searchProcDef(keyword),
                this.searchChatRoom(keyword),
                this.searchChat(keyword)
            ]);
        }
        results = results.filter(item => item !== null);
        return results;
    }

    async searchProcInst(keyword) {
        try {
            const email = window.localStorage.getItem('email');
            const data = await this.callProcedure('search_bpm_proc_inst', {
                keyword,
                user_email: email
            });

            if (data && data.length > 0) {
                const list = data.map((item) => {
                    const matchingColumns = [];
                    if (item.proc_inst_id && item.proc_inst_id.toLowerCase().includes(keyword.toLowerCase())) {
                        matchingColumns.push(item.proc_inst_id);
                    }
                    if (item.proc_inst_name && item.proc_inst_name.toLowerCase().includes(keyword.toLowerCase())) {
                        matchingColumns.push(item.proc_inst_name);
                    }
                    if (item.variables_data && JSON.stringify(item.variables_data).toLowerCase().includes(keyword.toLowerCase())) {
                        matchingColumns.push(JSON.stringify(item.variables_data));
                    }
                    return {
                        title: item.proc_inst_name,
                        href: `/instancelist/${btoa(item.proc_inst_id)}`,
                        matches: matchingColumns
                    };
                });
                if (list.length > 0) {
                    return {
                        type: 'instance',
                        header: '프로세스 인스턴스',
                        list: list
                    };
                }
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    async searchProcDef(keyword) {
        try {
            const { data, error } = await window.$supabase.from('proc_def')
                .select()
                .eq('isdeleted', false)
                .or(`id.ilike.%${keyword}%,name.ilike.%${keyword}%,bpmn.ilike.%${keyword}%`);

            if (error) throw new StorageBaseError('error in searchProcDef', error, arguments);

            if (data && data.length > 0) {
                let list = data.map((item) => {
                    if (!item.id) return null;
                    const matchingColumns = [];
                    const lowerKeyword = keyword.toLowerCase();
                    
                    if (item.id && item.id.toLowerCase().includes(lowerKeyword)) {
                        matchingColumns.push(item.id);
                    }
                    if (item.name && item.name.toLowerCase().includes(lowerKeyword)) {
                        matchingColumns.push(item.name);
                    }
                    if (item.bpmn && item.bpmn.toLowerCase().includes(lowerKeyword)) {
                        matchingColumns.push(item.bpmn);
                    }
                    
                    return {
                        title: item.name,
                        href: `/definitions/${item.id}`,
                        matches: matchingColumns
                    };
                });
                list = list.filter(item => item !== null);
                if (list.length > 0) {
                    return {
                        type: 'definition',
                        header: '프로세스 정의',
                        list: list
                    };
                }
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    async searchFormDef(keyword) {
        try {
            const { data, error } = await window.$supabase.from('form_def')
                .select()
                .ilike('id', `%${keyword}%`);

            if (error) throw new StorageBaseError('error in searchFormDef', error, arguments);

            if (data && data.length > 0) {
                let list = data.map((item) => {
                    const matchingColumns = [];
                    if (item.id && item.id.toLowerCase().includes(keyword.toLowerCase())) {
                        matchingColumns.push(item.id);
                    }
                    return {
                        title: item.id,
                        href: `/ui-definitions/${item.id}`,
                        matches: matchingColumns
                    };
                });
                list = list.filter(item => item !== null);
                if (list.length > 0) {
                    return {
                        type: 'form',
                        header: '화면 정의',
                        list: list
                    };
                }
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    async searchChatRoom(keyword) {
        try {
            const email = window.localStorage.getItem('email');
            const { data, error } = await window.$supabase.from('chat_rooms')
                .select()
                .or(`name.ilike.%${keyword}%`)

            if (error) throw new StorageBaseError('error in searchChat', error, arguments);

            const filteredData = data.filter(item => item.participants.some(participant => participant.email === email));
            if (filteredData && filteredData.length > 0) {
                let list = filteredData.map((item) => {
                    const matchingColumns = [item.participants.map(user => user.username).join(', ')]
                    return {
                        title: item.name,
                        href: `/chats?id=${item.id}`,
                        matches: matchingColumns
                    };
                });
                list = list.filter(item => item !== null);
                if (list.length > 0) {
                    return {
                        type: 'chat-room',
                        header: '채팅방',
                        list: list
                    };
                }
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    async searchChat(keyword) {
        try {
            const data = await this.callProcedure('search_chat_room_chats', { keyword: keyword });

            if (data && data.length > 0) {
                let list = data.map((item) => {
                    const email = window.localStorage.getItem('email');
                    if (item.participants && item.participants.some(participant => participant.email === email)) {
                        const matchingColumns = [`${item.messages.name}: ${item.messages.content}`];
                        return {
                            title: item.name,
                            href: `/chats?id=${item.id}`,
                            matches: matchingColumns
                        };
                    } else {
                        return null
                    }
                });
                list = list.filter(item => item !== null);
                if (list.length > 0) {
                    return {
                        type: 'chat',
                        header: '채팅 메시지',
                        list: list
                    };
                }
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    async uploadImage(fileName, image) {
        try {
            const { data, error } = await window.$supabase.storage.from('chat-images').upload(fileName, image);

            if (error) {
                return error;
            }

            return data;

        } catch (error) {
            throw new StorageBaseError('error in uploadImage', error, arguments);
        }
    }

    async getImageUrl(path) {
        try {
            const { data, error } = await window.$supabase.storage.from('chat-images').getPublicUrl(path);

            if (error) {
                return error;
            }

            return data.publicUrl;

        } catch (error) {
            throw new StorageBaseError('error in getImageUrl', error, arguments);
        }
    }

    async uploadFile(fileName, file) {
        try {
            const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
            const storageFileName = `uploads/${Date.now()}_${sanitizedFileName}`;
            
            const { data, error } = await window.$supabase.storage
                .from('files')
                .upload(storageFileName, file, {
                    cacheControl: '3600',
                    upsert: false,
                    metadata: {
                        original_filename: fileName
                    }
                });

            if (error) {
                return error;
            }

            // Get public URL for the uploaded file
            const publicUrl = await this.getFileUrl(data.path);

            return {
                ...data,
                originalFileName: fileName,
                publicUrl: publicUrl,
                fullPath: publicUrl
            };
        } catch (error) {
            throw new StorageBaseError('error in uploadFile', error, arguments);
        }
    }

    async getFileUrl(path) {
        try {
            const { data, error } = await window.$supabase.storage.from('files').getPublicUrl(path);

            if (error) {
                return error;
            }

            return data.publicUrl;
        } catch (error) {
            throw new StorageBaseError('error in getFileUrl', error, arguments);
        }
    }

    async downloadFile(path) {
        try {
            const { data: urlData, error: urlError } = await window.$supabase.storage
                .from('files')
                .getPublicUrl(path);

            if (urlError) {
                console.log(urlError);
                return urlError;
            }

            const response = await fetch(urlData.publicUrl);
            const blob = await response.blob();
            
            const originalFileName = path.split('/').pop().split('_').slice(1).join('_');
            const file = new File([blob], originalFileName, { type: blob.type });

            if (file) {
                return {
                    file: file,
                    file_path: path,
                    originalFileName: originalFileName
                };
            } else {
                return null;
            }
        } catch (error) {
            throw new StorageBaseError('error in downloadFile', error, arguments);
        }
    }


}
