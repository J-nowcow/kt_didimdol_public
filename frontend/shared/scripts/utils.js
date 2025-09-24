// 디딤돌 공통 유틸리티 함수

/**
 * DOM 요소를 안전하게 선택
 * @param {string} selector - CSS 선택자
 * @param {Element} parent - 부모 요소 (기본값: document)
 * @returns {Element|null}
 */
function $(selector, parent = document) {
    return parent.querySelector(selector);
}

/**
 * 여러 DOM 요소를 선택
 * @param {string} selector - CSS 선택자
 * @param {Element} parent - 부모 요소 (기본값: document)
 * @returns {NodeList}
 */
function $$(selector, parent = document) {
    return parent.querySelectorAll(selector);
}

/**
 * 요소에 클래스 추가
 * @param {Element} element - 대상 요소
 * @param {string} className - 추가할 클래스명
 */
function addClass(element, className) {
    if (element) {
        element.classList.add(className);
    }
}

/**
 * 요소에서 클래스 제거
 * @param {Element} element - 대상 요소
 * @param {string} className - 제거할 클래스명
 */
function removeClass(element, className) {
    if (element) {
        element.classList.remove(className);
    }
}

/**
 * 요소에 클래스 토글
 * @param {Element} element - 대상 요소
 * @param {string} className - 토글할 클래스명
 */
function toggleClass(element, className) {
    if (element) {
        element.classList.toggle(className);
    }
}

/**
 * 요소가 특정 클래스를 가지고 있는지 확인
 * @param {Element} element - 대상 요소
 * @param {string} className - 확인할 클래스명
 * @returns {boolean}
 */
function hasClass(element, className) {
    return element ? element.classList.contains(className) : false;
}

/**
 * 요소 표시/숨김
 * @param {Element} element - 대상 요소
 * @param {boolean} show - 표시 여부
 */
function toggleVisibility(element, show) {
    if (element) {
        element.style.display = show ? 'block' : 'none';
    }
}

/**
 * 요소에 스타일 적용
 * @param {Element} element - 대상 요소
 * @param {Object} styles - 스타일 객체
 */
function setStyles(element, styles) {
    if (element) {
        Object.assign(element.style, styles);
    }
}

/**
 * 디바운스 함수
 * @param {Function} func - 실행할 함수
 * @param {number} wait - 대기 시간 (ms)
 * @returns {Function}
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 스로틀 함수
 * @param {Function} func - 실행할 함수
 * @param {number} limit - 제한 시간 (ms)
 * @returns {Function}
 */
function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 로컬 스토리지에 데이터 저장
 * @param {string} key - 키
 * @param {any} value - 값
 */
function setStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('로컬 스토리지 저장 실패:', error);
    }
}

/**
 * 로컬 스토리지에서 데이터 가져오기
 * @param {string} key - 키
 * @param {any} defaultValue - 기본값
 * @returns {any}
 */
function getStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('로컬 스토리지 읽기 실패:', error);
        return defaultValue;
    }
}

/**
 * 로컬 스토리지에서 데이터 제거
 * @param {string} key - 키
 */
function removeStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('로컬 스토리지 제거 실패:', error);
    }
}

/**
 * URL 파라미터 가져오기
 * @param {string} name - 파라미터명
 * @returns {string|null}
 */
function getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

/**
 * URL 파라미터 설정
 * @param {string} name - 파라미터명
 * @param {string} value - 값
 */
function setUrlParam(name, value) {
    const url = new URL(window.location);
    url.searchParams.set(name, value);
    window.history.pushState({}, '', url);
}

/**
 * 현재 시간을 포맷된 문자열로 반환
 * @param {Date} date - 날짜 객체
 * @returns {string}
 */
function formatDate(date = new Date()) {
    // 문자열인 경우 Date 객체로 변환
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    // Date 객체가 유효한지 확인
    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return '날짜 없음';
    }
    
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

/**
 * 현재 시간을 포맷된 문자열로 반환
 * @param {Date} date - 날짜 객체
 * @returns {string}
 */
function formatTime(date = new Date()) {
    return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

/**
 * 숫자를 천 단위 구분자와 함께 포맷
 * @param {number} num - 숫자
 * @returns {string}
 */
function formatNumber(num) {
    return num.toLocaleString('ko-KR');
}

/**
 * 문자열을 안전하게 이스케이프
 * @param {string} str - 문자열
 * @returns {string}
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * 랜덤 ID 생성
 * @param {number} length - 길이
 * @returns {string}
 */
function generateId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * 두 날짜 간의 차이를 일 단위로 계산
 * @param {Date} date1 - 첫 번째 날짜
 * @param {Date} date2 - 두 번째 날짜
 * @returns {number}
 */
function daysBetween(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date1 - date2) / oneDay));
}

/**
 * 배열을 랜덤하게 섞기
 * @param {Array} array - 배열
 * @returns {Array}
 */
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

/**
 * 객체의 깊은 복사
 * @param {any} obj - 복사할 객체
 * @returns {any}
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

// 전역 객체에 유틸리티 함수들 추가
window.DidimdolUtils = {
    $,
    $$,
    addClass,
    removeClass,
    toggleClass,
    hasClass,
    toggleVisibility,
    setStyles,
    debounce,
    throttle,
    setStorage,
    getStorage,
    removeStorage,
    getUrlParam,
    setUrlParam,
    formatDate,
    formatTime,
    formatNumber,
    escapeHtml,
    generateId,
    daysBetween,
    shuffleArray,
    deepClone
};
