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
    
    // 로딩 상태 시뮬레이션 (3초 이내 로드 요구사항)
    setTimeout(() => {
        document.body.classList.add('loaded');
        console.log('대시보드 로드 완료');
    }, 2000);
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
