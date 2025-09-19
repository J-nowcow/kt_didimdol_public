// 디딤돌 메인 대시보드 JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // 페이지 로드 시 초기화
    initializeDashboard();
    
    // 이벤트 리스너 등록
    setupEventListeners();
    
    // 프로그레스 바 애니메이션 시작
    startProgressAnimation();
});

// 대시보드 초기화
function initializeDashboard() {
    console.log('디딤돌 대시보드 초기화 중...');
    
    // 예외 상황 시뮬레이션을 위한 설정
    setupExceptionStates();
    
    // 로딩 상태 시뮬레이션 (3초 이내 로드 요구사항)
    setTimeout(() => {
        document.body.classList.add('loaded');
        console.log('대시보드 로드 완료');
    }, 2000);
}

// 예외 상황 설정
function setupExceptionStates() {
    // URL 파라미터로 예외 상황 시뮬레이션
    const urlParams = new URLSearchParams(window.location.search);
    const exceptionType = urlParams.get('exception');
    
    switch(exceptionType) {
        case 'no-handover':
            showEmptyHandoverState();
            break;
        case 'no-materials':
            showEmptyMaterialsState();
            break;
        case 'no-completed':
            showEmptyCompletedState();
            break;
        case 'system-failure':
            showSystemFailureState();
            break;
        case 'error':
            showErrorState();
            break;
        default:
            // 정상 상태 (기본값)
            break;
    }
}

// Empty State: 진행 중인 인수인계서가 없는 경우
function showEmptyHandoverState() {
    const emptyStateCard = document.getElementById('emptyStateCard');
    const currentHandoverCard = document.getElementById('currentHandoverCard');
    
    if (emptyStateCard && currentHandoverCard) {
        emptyStateCard.style.display = 'block';
        currentHandoverCard.style.display = 'none';
    }
}

// Empty State: 수집된 자료가 없는 경우
function showEmptyMaterialsState() {
    const emptyMaterialsState = document.getElementById('emptyMaterialsState');
    const materialsGrid = document.getElementById('materialsGrid');
    
    if (emptyMaterialsState && materialsGrid) {
        emptyMaterialsState.style.display = 'block';
        materialsGrid.style.display = 'none';
    }
}

// Empty State: 완료된 인수인계서가 없는 경우
function showEmptyCompletedState() {
    const emptyCompletedState = document.getElementById('emptyCompletedState');
    const completedList = document.getElementById('completedList');
    
    if (emptyCompletedState && completedList) {
        emptyCompletedState.style.display = 'block';
        completedList.style.display = 'none';
    }
}

// Error State: 시스템 연결 실패
function showSystemFailureState() {
    const systemErrorState = document.getElementById('systemErrorState');
    const systemList = document.getElementById('systemList');
    
    if (systemErrorState && systemList) {
        systemErrorState.style.display = 'block';
        
        // 시스템 연결 상태를 실패로 표시
        const systemItems = systemList.querySelectorAll('.system-item');
        systemItems.forEach((item, index) => {
            if (index < 2) { // 처음 2개 시스템만 실패로 표시
                item.style.color = '#cc3333';
                item.innerHTML = `❌ ${item.textContent.replace('🔗 ', '')} 연결 실패`;
            }
        });
    }
}

// Error State: 전체 시스템 오류
function showErrorState() {
    const globalErrorOverlay = document.getElementById('globalErrorOverlay');
    
    if (globalErrorOverlay) {
        globalErrorOverlay.style.display = 'flex';
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 작업 계속하기 버튼
    const continueButton = document.querySelector('.continue-button');
    if (continueButton) {
        continueButton.addEventListener('click', handleContinueWork);
    }
    
    // 새 인수인계서 작성 버튼
    const newHandoverButton = document.querySelector('.new-handover-button');
    if (newHandoverButton) {
        newHandoverButton.addEventListener('click', handleNewHandover);
    }
    
    // 보기 버튼들
    const viewButtons = document.querySelectorAll('.view-button');
    viewButtons.forEach(button => {
        button.addEventListener('click', handleViewCompleted);
    });
    
    // 자료 카드 호버 효과
    const materialCards = document.querySelectorAll('.material-card');
    materialCards.forEach(card => {
        card.addEventListener('mouseenter', handleMaterialCardHover);
        card.addEventListener('mouseleave', handleMaterialCardLeave);
    });
    
    // 완료된 인수인계서 카드 호버 효과
    const completedCards = document.querySelectorAll('.completed-card');
    completedCards.forEach(card => {
        card.addEventListener('mouseenter', handleCompletedCardHover);
        card.addEventListener('mouseleave', handleCompletedCardLeave);
    });
    
    // 예외 상황 버튼들
    const emptyStateButton = document.querySelector('.empty-state-button');
    if (emptyStateButton) {
        emptyStateButton.addEventListener('click', handleNewHandover);
    }
    
    const startCollectionButton = document.querySelector('.start-collection-button');
    if (startCollectionButton) {
        startCollectionButton.addEventListener('click', handleStartCollection);
    }
    
    const firstHandoverButton = document.querySelector('.first-handover-button');
    if (firstHandoverButton) {
        firstHandoverButton.addEventListener('click', handleNewHandover);
    }
    
    const retryConnectionButton = document.querySelector('.retry-connection-button');
    if (retryConnectionButton) {
        retryConnectionButton.addEventListener('click', handleRetryConnection);
    }
    
    const retryButton = document.querySelector('.retry-button');
    if (retryButton) {
        retryButton.addEventListener('click', handleRetrySystem);
    }
    
    const contactAdminButton = document.querySelector('.contact-admin-button');
    if (contactAdminButton) {
        contactAdminButton.addEventListener('click', handleContactAdmin);
    }
}

// 프로그레스 바 애니메이션 시작
function startProgressAnimation() {
    const progressFill = document.querySelector('.progress-fill.animated');
    if (progressFill) {
        // 프로그레스 바가 시각적으로 움직이는 효과
        progressFill.style.transition = 'width 0.3s ease';
    }
}

// 작업 계속하기 버튼 클릭 핸들러
function handleContinueWork(event) {
    event.preventDefault();
    console.log('작업 계속하기 클릭됨');
    
    // 버튼 클릭 효과
    const button = event.target;
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 150);
    
    // 실제 구현에서는 인수인계서 편집 페이지로 이동
    alert('인수인계서 편집 페이지로 이동합니다. (구현 예정)');
}

// 새 인수인계서 작성 버튼 클릭 핸들러
function handleNewHandover(event) {
    event.preventDefault();
    console.log('새 인수인계서 작성 클릭됨');
    
    // 버튼 클릭 효과
    const button = event.target.closest('.new-handover-button');
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 150);
    
    // 실제 구현에서는 새 인수인계서 작성 페이지로 이동
    alert('새 인수인계서 작성 페이지로 이동합니다. (구현 예정)');
}

// 완료된 인수인계서 보기 버튼 클릭 핸들러
function handleViewCompleted(event) {
    event.preventDefault();
    const card = event.target.closest('.completed-card');
    const title = card.querySelector('.completed-title').textContent;
    
    console.log(`완료된 인수인계서 보기: ${title}`);
    
    // 버튼 클릭 효과
    const button = event.target;
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 150);
    
    // 실제 구현에서는 해당 인수인계서 상세 페이지로 이동
    alert(`${title} 상세 페이지로 이동합니다. (구현 예정)`);
}

// 자료 카드 호버 효과
function handleMaterialCardHover(event) {
    const card = event.target;
    card.style.transform = 'translateY(-2px)';
    card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
}

function handleMaterialCardLeave(event) {
    const card = event.target;
    card.style.transform = 'translateY(0)';
    card.style.boxShadow = 'none';
}

// 완료된 인수인계서 카드 호버 효과
function handleCompletedCardHover(event) {
    const card = event.target;
    card.style.transform = 'translateY(-2px)';
    card.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
}

function handleCompletedCardLeave(event) {
    const card = event.target;
    card.style.transform = 'translateY(0)';
    card.style.boxShadow = 'none';
}

// 시스템 연결 상태 확인 (시뮬레이션)
function checkSystemStatus() {
    const systems = ['Confluence', 'Github', 'Jira', 'Wiki', 'Teams', 'Slack'];
    const systemItems = document.querySelectorAll('.system-item');
    
    systemItems.forEach((item, index) => {
        // 랜덤하게 연결 상태 시뮬레이션
        const isConnected = Math.random() > 0.1; // 90% 확률로 연결됨
        
        if (isConnected) {
            item.style.color = '#0fba82';
            item.innerHTML = `✅ ${systems[index]}`;
        } else {
            item.style.color = '#cc3333';
            item.innerHTML = `❌ ${systems[index]} 연결 실패`;
        }
    });
}

// 수집된 자료 현황 업데이트 (시뮬레이션)
function updateMaterialsCount() {
    const materialCounts = document.querySelectorAll('.material-count');
    
    materialCounts.forEach(count => {
        // 숫자 애니메이션 효과
        const finalValue = count.textContent;
        const numericValue = parseInt(finalValue);
        
        let currentValue = 0;
        const increment = numericValue / 20;
        
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= numericValue) {
                count.textContent = finalValue;
                clearInterval(timer);
            } else {
                count.textContent = Math.floor(currentValue) + finalValue.replace(/\d+/, '');
            }
        }, 50);
    });
}

// 페이지 로드 완료 후 추가 초기화
window.addEventListener('load', function() {
    // 시스템 연결 상태 확인
    setTimeout(checkSystemStatus, 1000);
    
    // 수집된 자료 현황 애니메이션
    setTimeout(updateMaterialsCount, 1500);
    
    console.log('디딤돌 대시보드 완전 로드 완료');
});

// 키보드 접근성 지원
document.addEventListener('keydown', function(event) {
    // Enter 키로 버튼 활성화
    if (event.key === 'Enter') {
        const focusedElement = document.activeElement;
        if (focusedElement.classList.contains('continue-button') || 
            focusedElement.classList.contains('new-handover-button') ||
            focusedElement.classList.contains('view-button')) {
            focusedElement.click();
        }
    }
    
    // Escape 키로 모달 닫기 (향후 구현)
    if (event.key === 'Escape') {
        // 모달이 열려있다면 닫기
        console.log('Escape 키로 모달 닫기');
    }
});

// 반응형 디자인 지원
function handleResize() {
    const dashboard = document.querySelector('.dashboard-container');
    const width = window.innerWidth;
    
    if (width <= 1600) {
        dashboard.classList.add('mobile-layout');
    } else {
        dashboard.classList.remove('mobile-layout');
    }
}

window.addEventListener('resize', handleResize);

// 초기 리사이즈 처리
handleResize();

// 예외 상황 버튼 핸들러들
function handleStartCollection(event) {
    event.preventDefault();
    console.log('자료 수집 시작하기 클릭됨');
    alert('자료 수집을 시작합니다. (구현 예정)');
}

function handleRetryConnection(event) {
    event.preventDefault();
    console.log('재연결 버튼 클릭됨');
    
    // 재연결 시뮬레이션
    const systemItems = document.querySelectorAll('.system-item');
    systemItems.forEach((item, index) => {
        if (index < 2) {
            item.style.color = '#0fba82';
            item.innerHTML = `✅ ${item.textContent.replace('❌ ', '').replace(' 연결 실패', '')}`;
        }
    });
    
    // 시스템 오류 상태 숨기기
    const systemErrorState = document.getElementById('systemErrorState');
    if (systemErrorState) {
        systemErrorState.style.display = 'none';
    }
    
    alert('시스템 재연결을 시도합니다...');
}

function handleRetrySystem(event) {
    event.preventDefault();
    console.log('다시 시도 버튼 클릭됨');
    
    // 오류 모달 숨기기
    const globalErrorOverlay = document.getElementById('globalErrorOverlay');
    if (globalErrorOverlay) {
        globalErrorOverlay.style.display = 'none';
    }
    
    // 페이지 새로고침 시뮬레이션
    alert('시스템을 다시 시도합니다...');
    setTimeout(() => {
        location.reload();
    }, 1000);
}

function handleContactAdmin(event) {
    event.preventDefault();
    console.log('관리자 문의 버튼 클릭됨');
    alert('관리자에게 문의합니다. (구현 예정)');
}
