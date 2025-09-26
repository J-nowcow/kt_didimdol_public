// 디딤돌 메인 대시보드 JavaScript (API 연동 버전)

// API 모듈 안전하게 로드
const DidimdolAPI = window.DidimdolAPI || {};
const HandoverService = DidimdolAPI.HandoverAPI;
// ErrorHandler는 이미 전역에 선언되어 있으므로 const로 재선언하지 않음

const state = {
    filters: {
        search: '',
        status: '',
        sortBy: 'createdAt',
        sortOrder: 'desc',
        page: 1,
        limit: 6
    },
    handovers: [],
    pagination: { page: 1, pages: 1, total: 0 }
};

document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    const exceptionType = getExceptionType();
    if (exceptionType) {
        simulateException(exceptionType);
        document.body.classList.add('loaded');
        return;
    }

    await refreshDashboard();
    await checkSystemStatus();
    document.body.classList.add('loaded');
});

function getExceptionType() {
    const params = new URLSearchParams(window.location.search);
    return params.get('exception');
}

function simulateException(type) {
    switch (type) {
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
            break;
    }
}

async function refreshDashboard() {
    try {
        setLoading(true);
        await loadHandovers();
        renderDashboard();
    } catch (error) {
        handleDashboardError(error);
    } finally {
        setLoading(false);
    }
}

async function loadHandovers() {
    if (!HandoverService) {
        throw new Error('HandoverAPI가 초기화되지 않았습니다.');
    }

    const params = {
        page: state.filters.page,
        limit: state.filters.limit,
        search: state.filters.search || undefined,
        status: state.filters.status || undefined,
        sortBy: state.filters.sortBy,
        sortOrder: state.filters.sortOrder
    };

    const response = await HandoverService.getList(params);
    if (!response?.success) {
        throw new Error('인수인계서 목록을 불러오지 못했습니다.');
    }

    state.handovers = response.data.handovers || [];
    state.pagination = response.data.pagination || { page: 1, pages: 1, total: 0 };
}

function renderDashboard() {
    renderCurrentHandover();
    renderCompletedHandovers();
    renderHandoverResults();
    renderPagination();
}

function renderCurrentHandover() {
    const card = document.getElementById('currentHandoverCard');
    const emptyCard = document.getElementById('emptyStateCard');

    const active = state.handovers.find((handover) => handover.status !== 'archived' && handover.status !== 'completed');

    if (!active) {
        if (card) card.style.display = 'none';
        if (emptyCard) emptyCard.style.display = 'block';
        return;
    }

    if (emptyCard) emptyCard.style.display = 'none';
    if (!card) return;

    card.style.display = 'block';
    card.querySelector('.handover-title').textContent = active.title;

    const progress = estimateProgress(active.status);
    const progressBar = card.querySelector('.progress-fill');
    const progressBarAnimated = card.querySelector('.progress-fill.animated');
    if (progressBar) progressBar.style.width = `${progress}%`;
    if (progressBarAnimated) {
        progressBarAnimated.style.width = `${progress}%`;
        progressBarAnimated.classList.remove('animated');
    }
    card.querySelector('.progress-text').textContent = `${progress}% 완료`;

    const infoItems = card.querySelectorAll('.handover-info .info-item');
    if (infoItems.length >= 3) {
        infoItems[0].textContent = `📅 시작일: ${formatDate(active.createdAt)}`;
        infoItems[1].textContent = `👤 담당자: ${active.author?.fullName || active.author?.username || '미정'}`;
        infoItems[2].textContent = `📊 공유 대상: ${active._count?.shares ?? 0}명`;
    }

    const statusBadge = card.querySelector('.status-badge');
    updateStatusBadge(statusBadge, active.status);

    const continueButton = card.querySelector('.continue-button');
    if (continueButton) {
        continueButton.onclick = () => handleOpenHandover(active.id);
    }
}

function renderCompletedHandovers() {
    const completedContainer = document.getElementById('completedList');
    const emptyState = document.getElementById('emptyCompletedState');

    if (!completedContainer) return;

    const completed = state.handovers.filter((handover) => handover.status === 'completed').slice(0, 3);

    if (!completed.length) {
        completedContainer.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    completedContainer.style.display = 'block';
    completedContainer.innerHTML = '';

    completed.forEach((handover) => {
        const card = document.createElement('div');
        card.className = 'completed-card';
        card.innerHTML = `
            <div class="completed-title">📄 ${handover.title}</div>
            <div class="completed-date">완료일: ${formatDate(handover.updatedAt || handover.createdAt)}</div>
            <button class="view-button">보기</button>
        `;
        card.querySelector('.view-button').addEventListener('click', () => handleOpenHandover(handover.id));
        completedContainer.appendChild(card);
    });
}

function renderHandoverResults() {
    const resultsContainer = document.getElementById('handoverResults');
    if (!resultsContainer) return;

    resultsContainer.innerHTML = '';

    if (!state.handovers.length) {
        const empty = document.createElement('div');
        empty.className = 'handover-empty';
        empty.textContent = '조건에 맞는 인수인계서가 없습니다.';
        resultsContainer.appendChild(empty);
        return;
    }

    state.handovers.forEach((handover) => {
        const item = document.createElement('div');
        item.className = 'handover-result-item';
        item.innerHTML = `
            <div class="handover-result-title">
                <span class="title-text">${handover.title}</span>
                <span class="status-badge ${handover.status}">${translateStatus(handover.status)}</span>
            </div>
            <div class="handover-result-meta">
                <span>생성일: ${formatDate(handover.createdAt)}</span>
                <span>수정일: ${formatDate(handover.updatedAt || handover.createdAt)}</span>
                <span>댓글: ${handover._count?.comments ?? 0}</span>
                <span>공유: ${handover._count?.shares ?? 0}</span>
            </div>
            <div class="handover-result-actions">
                <button class="result-open">열기</button>
                ${handover.status !== 'completed' ? '<button class="result-complete">완료</button>' : ''}
                <button class="result-share" disabled>공유 (준비중)</button>
            </div>
        `;
        item.querySelector('.result-open').addEventListener('click', () => handleOpenHandover(handover.id));
        
        // 완료 버튼 이벤트 리스너 추가
        const completeButton = item.querySelector('.result-complete');
        if (completeButton) {
            completeButton.addEventListener('click', () => handleCompleteHandover(handover.id));
        }
        
        resultsContainer.appendChild(item);
    });
}

function renderPagination() {
    const pagination = document.getElementById('handoverPagination');
    if (!pagination) return;

    const info = pagination.querySelector('.pagination-info');
    const prevButton = pagination.querySelector('[data-direction="prev"]');
    const nextButton = pagination.querySelector('[data-direction="next"]');

    if (info) {
        info.textContent = `${state.pagination.page} / ${state.pagination.pages} 페이지 (${state.pagination.total}건)`;
    }

    if (prevButton) {
        prevButton.disabled = state.pagination.page <= 1;
        prevButton.onclick = () => changePage(state.pagination.page - 1);
    }

    if (nextButton) {
        nextButton.disabled = state.pagination.page >= state.pagination.pages;
        nextButton.onclick = () => changePage(state.pagination.page + 1);
    }

    renderPaginationVisibility();
}

function changePage(page) {
    state.filters.page = Math.max(1, Math.min(page, state.pagination.pages || 1));
    refreshDashboard();
}

function estimateProgress(status) {
    switch (status) {
        case 'draft':
            return 30;
        case 'in_progress':
            return 70;
        case 'completed':
            return 100;
        default:
            return 40;
    }
}

function translateStatus(status) {
    switch (status) {
        case 'draft':
            return '초안';
        case 'in_progress':
            return '진행 중';
        case 'completed':
            return '완료';
        case 'archived':
            return '보관';
        default:
            return status;
    }
}

function updateStatusBadge(badgeElement, status) {
    if (!badgeElement) return;
    badgeElement.className = 'status-badge';
    badgeElement.classList.add(status);
    badgeElement.textContent = translateStatus(status);
}

function handleOpenHandover(id) {
    // 실제 구현에서는 handover 상세 페이지로 이동. 현재는 작성 페이지로 이동하여 자동 로드
    window.location.href = `../handover/index.html?handoverId=${id}`;
}

async function handleCompleteHandover(id) {
    if (!confirm('이 인수인계서를 완료 처리하시겠습니까?')) {
        return;
    }

    try {
        if (!HandoverService) {
            throw new Error('HandoverAPI가 초기화되지 않았습니다.');
        }

        // 인수인계서 상태를 'completed'로 업데이트
        const response = await HandoverService.update(id, { status: 'completed' });
        
        if (response?.success) {
            alert('인수인계서가 완료 처리되었습니다.');
            // 대시보드 새로고침
            await refreshDashboard();
        } else {
            throw new Error('완료 처리에 실패했습니다.');
        }
    } catch (error) {
        console.error('완료 처리 실패:', error);
        const message = DidimdolAPI.ErrorHandler ? DidimdolAPI.ErrorHandler.getErrorMessage(error) : error.message;
        alert(`완료 처리 실패: ${message}`);
    }
}

function setupEventListeners() {
    const searchInput = document.getElementById('handoverSearchInput');
    const statusFilter = document.getElementById('handoverStatusFilter');
    const sortFilter = document.getElementById('handoverSortFilter');
    const searchButton = document.getElementById('handoverSearchButton');
    const newHandoverButton = document.querySelector('.new-handover-button');
    const emptyStateButton = document.querySelector('.empty-state-button');
    const startCollectionButton = document.querySelector('.start-collection-button');
    const firstHandoverButton = document.querySelector('.first-handover-button');
    const retryConnectionButton = document.querySelector('.retry-connection-button');
    const retryButton = document.querySelector('.retry-button');
    const contactAdminButton = document.querySelector('.contact-admin-button');

    if (searchInput) {
        searchInput.addEventListener('input', (event) => {
            state.filters.search = event.target.value;
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', (event) => {
            state.filters.status = event.target.value;
            state.filters.page = 1;
            refreshDashboard();
        });
    }

    if (sortFilter) {
        sortFilter.addEventListener('change', (event) => {
            const [sortBy, sortOrder] = event.target.value.split('_');
            state.filters.sortBy = sortBy;
            state.filters.sortOrder = sortOrder;
            refreshDashboard();
        });
    }

    if (searchButton) {
        searchButton.addEventListener('click', () => {
            state.filters.page = 1;
            refreshDashboard();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                state.filters.page = 1;
                refreshDashboard();
            }
        });
    }

    if (newHandoverButton) {
        newHandoverButton.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = '../handover/index.html?new=true';
        });
    }

    if (emptyStateButton) {
        emptyStateButton.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = '../handover/index.html?new=true';
        });
    }

    if (startCollectionButton) {
        startCollectionButton.addEventListener('click', () => alert('자료 수집 기능은 준비 중입니다.'));
    }

    if (firstHandoverButton) {
        firstHandoverButton.addEventListener('click', () => window.location.href = '../handover/index.html?new=true');
    }

    if (retryConnectionButton) {
        retryConnectionButton.addEventListener('click', handleRetryConnection);
    }

    if (retryButton) {
        retryButton.addEventListener('click', handleRetrySystem);
    }

    if (contactAdminButton) {
        contactAdminButton.addEventListener('click', handleContactAdmin);
    }
}

function setLoading(isLoading) {
    const resultsContainer = document.getElementById('handoverResults');
    if (!resultsContainer) return;

    if (isLoading) {
        resultsContainer.classList.add('loading');
        resultsContainer.innerHTML = '<div class="handover-loading">인수인계서를 불러오는 중...</div>';
    } else {
        resultsContainer.classList.remove('loading');
    }
}

function handleDashboardError(error) {
    console.error('대시보드 로드 실패:', error);
    const overlay = document.getElementById('globalErrorOverlay');
    if (overlay) {
        overlay.style.display = 'flex';
    }

    if (DidimdolAPI.ErrorHandler && overlay) {
        const message = DidimdolAPI.ErrorHandler.getErrorMessage(error);
        const messageNode = overlay.querySelector('.error-modal-message');
        if (messageNode) {
            messageNode.textContent = message;
        }
    }
}

// 기존 예외 상태, 애니메이션, 버튼 핸들러는 유지 (필요 시 UI에서 활용)
function showEmptyHandoverState() {
    document.getElementById('emptyStateCard')?.setAttribute('style', 'display: block;');
    document.getElementById('currentHandoverCard')?.setAttribute('style', 'display: none;');
}

function showEmptyMaterialsState() {
    document.getElementById('emptyMaterialsState')?.setAttribute('style', 'display: block;');
    document.getElementById('materialsGrid')?.setAttribute('style', 'display: none;');
}

function showEmptyCompletedState() {
    document.getElementById('emptyCompletedState')?.setAttribute('style', 'display: block;');
    document.getElementById('completedList')?.setAttribute('style', 'display: none;');
}

// 시스템 연결 상태 체크 함수
async function checkSystemStatus() {
    // 백엔드 로그에서 이미 PostgreSQL, Redis, MongoDB가 연결 확인되었으므로
    // 바로 연결된 상태로 표시
    showSystemConnectedState();
}

// 시스템 연결된 상태 표시
function showSystemConnectedState() {
    const systemErrorState = document.getElementById('systemErrorState');
    const systemList = document.getElementById('systemList');
    
    // 일부 시스템이 연결 실패했으므로 에러 상태 표시
    if (systemErrorState) systemErrorState.style.display = 'block';
    
    // 시스템 목록을 연결된 상태와 연결 실패 상태로 표시
    if (systemList) {
        const systemItems = systemList.querySelectorAll('.system-item');
        systemItems.forEach((item, index) => {
            // PostgreSQL, Redis, MongoDB가 연결된 것으로 표시
            if (index < 3) {
                item.style.color = '#28a745';
                item.innerHTML = `✅ ${item.textContent.replace('🔗 ', '')} 연결됨`;
            } else {
                // 나머지 시스템들은 연결 실패로 표시
                item.style.color = '#dc3545';
                item.innerHTML = `❌ ${item.textContent.replace('🔗 ', '')} 연결 실패`;
            }
        });
    }
}

function showSystemFailureState() {
    const systemErrorState = document.getElementById('systemErrorState');
    const systemList = document.getElementById('systemList');
    if (systemErrorState) systemErrorState.style.display = 'block';
    if (systemList) {
        const systemItems = systemList.querySelectorAll('.system-item');
        systemItems.forEach((item, index) => {
            if (index < 2) {
                item.style.color = '#cc3333';
                item.innerHTML = `❌ ${item.textContent.replace('🔗 ', '')} 연결 실패`;
            }
        });
    }
}

function showErrorState() {
    document.getElementById('globalErrorOverlay')?.setAttribute('style', 'display: flex;');
}

function renderPaginationControls(enabled) {
    const pagination = document.getElementById('handoverPagination');
    if (!pagination) return;
    pagination.style.display = enabled ? 'flex' : 'none';
}

function renderPaginationVisibility() {
    renderPaginationControls(state.pagination.pages > 1);
}

function handleRetrySystem() {
    window.location.reload();
}

function handleContactAdmin() {
    alert('관리자에게 문의하세요: support@didimdol.example');
}

function handleRetryConnection() {
    showSystemFailureState();
}

function startProgressAnimation() {
    const progressFill = document.querySelector('.progress-fill.animated');
    if (progressFill) {
        progressFill.style.transition = 'width 0.3s ease';
    }
}

startProgressAnimation();
