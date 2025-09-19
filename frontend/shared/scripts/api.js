// 디딤돌 API 통신 모듈

/**
 * API 기본 설정
 */
const API_CONFIG = {
    baseURL: '/api/v1',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

/**
 * HTTP 요청 클래스
 */
class ApiClient {
    constructor(config = {}) {
        this.config = { ...API_CONFIG, ...config };
    }

    /**
     * GET 요청
     * @param {string} url - 요청 URL
     * @param {Object} params - 쿼리 파라미터
     * @param {Object} options - 추가 옵션
     * @returns {Promise}
     */
    async get(url, params = {}, options = {}) {
        const queryString = new URLSearchParams(params).toString();
        const fullUrl = queryString ? `${url}?${queryString}` : url;
        
        return this.request('GET', fullUrl, null, options);
    }

    /**
     * POST 요청
     * @param {string} url - 요청 URL
     * @param {Object} data - 요청 데이터
     * @param {Object} options - 추가 옵션
     * @returns {Promise}
     */
    async post(url, data = {}, options = {}) {
        return this.request('POST', url, data, options);
    }

    /**
     * PUT 요청
     * @param {string} url - 요청 URL
     * @param {Object} data - 요청 데이터
     * @param {Object} options - 추가 옵션
     * @returns {Promise}
     */
    async put(url, data = {}, options = {}) {
        return this.request('PUT', url, data, options);
    }

    /**
     * DELETE 요청
     * @param {string} url - 요청 URL
     * @param {Object} options - 추가 옵션
     * @returns {Promise}
     */
    async delete(url, options = {}) {
        return this.request('DELETE', url, null, options);
    }

    /**
     * 기본 HTTP 요청 메서드
     * @param {string} method - HTTP 메서드
     * @param {string} url - 요청 URL
     * @param {Object} data - 요청 데이터
     * @param {Object} options - 추가 옵션
     * @returns {Promise}
     */
    async request(method, url, data = null, options = {}) {
        const config = {
            method,
            headers: { ...this.config.headers, ...options.headers },
            ...options
        };

        if (data) {
            config.body = JSON.stringify(data);
        }

        const fullUrl = url.startsWith('http') ? url : `${this.config.baseURL}${url}`;
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
            
            const response = await fetch(fullUrl, {
                ...config,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return await response.text();
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('요청 시간이 초과되었습니다.');
            }
            throw error;
        }
    }
}

/**
 * API 클라이언트 인스턴스
 */
const apiClient = new ApiClient();

/**
 * 인수인계서 관련 API
 */
export const HandoverAPI = {
    /**
     * 인수인계서 목록 조회
     * @param {Object} params - 쿼리 파라미터
     * @returns {Promise}
     */
    async getList(params = {}) {
        return apiClient.get('/handovers', params);
    },

    /**
     * 인수인계서 상세 조회
     * @param {string} id - 인수인계서 ID
     * @returns {Promise}
     */
    async getById(id) {
        return apiClient.get(`/handovers/${id}`);
    },

    /**
     * 새 인수인계서 생성
     * @param {Object} data - 인수인계서 데이터
     * @returns {Promise}
     */
    async create(data) {
        return apiClient.post('/handovers', data);
    },

    /**
     * 인수인계서 수정
     * @param {string} id - 인수인계서 ID
     * @param {Object} data - 수정할 데이터
     * @returns {Promise}
     */
    async update(id, data) {
        return apiClient.put(`/handovers/${id}`, data);
    },

    /**
     * 인수인계서 삭제
     * @param {string} id - 인수인계서 ID
     * @returns {Promise}
     */
    async delete(id) {
        return apiClient.delete(`/handovers/${id}`);
    }
};

/**
 * 시스템 연결 상태 관련 API
 */
export const SystemAPI = {
    /**
     * 시스템 연결 상태 조회
     * @returns {Promise}
     */
    async getStatus() {
        return apiClient.get('/systems/status');
    },

    /**
     * 시스템 재연결
     * @param {string} systemName - 시스템명
     * @returns {Promise}
     */
    async reconnect(systemName) {
        return apiClient.post(`/systems/${systemName}/reconnect`);
    }
};

/**
 * 수집된 자료 관련 API
 */
export const MaterialsAPI = {
    /**
     * 수집된 자료 현황 조회
     * @returns {Promise}
     */
    async getStatus() {
        return apiClient.get('/materials/status');
    },

    /**
     * 자료 수집 시작
     * @param {Object} config - 수집 설정
     * @returns {Promise}
     */
    async startCollection(config) {
        return apiClient.post('/materials/collect', config);
    }
};

/**
 * 사용자 관련 API
 */
export const UserAPI = {
    /**
     * 현재 사용자 정보 조회
     * @returns {Promise}
     */
    async getCurrentUser() {
        return apiClient.get('/user/me');
    },

    /**
     * 사용자 설정 조회
     * @returns {Promise}
     */
    async getSettings() {
        return apiClient.get('/user/settings');
    },

    /**
     * 사용자 설정 업데이트
     * @param {Object} settings - 설정 데이터
     * @returns {Promise}
     */
    async updateSettings(settings) {
        return apiClient.put('/user/settings', settings);
    }
};

/**
 * 에러 처리 유틸리티
 */
export const ErrorHandler = {
    /**
     * API 에러를 사용자 친화적 메시지로 변환
     * @param {Error} error - 에러 객체
     * @returns {string}
     */
    getErrorMessage(error) {
        if (error.message.includes('HTTP 401')) {
            return '인증이 필요합니다. 다시 로그인해주세요.';
        }
        if (error.message.includes('HTTP 403')) {
            return '접근 권한이 없습니다.';
        }
        if (error.message.includes('HTTP 404')) {
            return '요청한 리소스를 찾을 수 없습니다.';
        }
        if (error.message.includes('HTTP 500')) {
            return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        }
        if (error.message.includes('요청 시간이 초과')) {
            return '요청 시간이 초과되었습니다. 네트워크 상태를 확인해주세요.';
        }
        return '알 수 없는 오류가 발생했습니다.';
    },

    /**
     * 에러 로깅
     * @param {Error} error - 에러 객체
     * @param {string} context - 에러 발생 컨텍스트
     */
    logError(error, context = '') {
        console.error(`[${context}] API Error:`, error);
        // 실제 환경에서는 에러 로깅 서비스로 전송
    }
};

/**
 * API 응답 인터셉터
 */
export const ResponseInterceptor = {
    /**
     * 성공 응답 처리
     * @param {any} response - API 응답
     * @returns {any}
     */
    onSuccess(response) {
        console.log('API Success:', response);
        return response;
    },

    /**
     * 에러 응답 처리
     * @param {Error} error - 에러 객체
     * @returns {Promise}
     */
    async onError(error) {
        const message = ErrorHandler.getErrorMessage(error);
        ErrorHandler.logError(error, 'ResponseInterceptor');
        
        // 사용자에게 에러 메시지 표시
        if (window.DidimdolUtils) {
            // 에러 토스트나 모달 표시 로직
            console.error('API Error:', message);
        }
        
        throw error;
    }
};

// 전역 객체에 API 모듈들 추가
window.DidimdolAPI = {
    HandoverAPI,
    SystemAPI,
    MaterialsAPI,
    UserAPI,
    ErrorHandler,
    ResponseInterceptor
};
