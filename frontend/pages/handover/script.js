// 인수인계서 작성 페이지 JavaScript (API 연동 + 자동저장 강화)

// API 모듈 안전하게 로드
const DidimdolAPI = window.DidimdolAPI || {};
const HandoverService = DidimdolAPI.HandoverAPI;
// ErrorHandler는 이미 전역에 선언되어 있으므로 const로 재선언하지 않음

const LOCAL_STORAGE_KEY = 'didimdol.handoverDraft';
const SAVE_DEBOUNCE_MS = 1500;
const AUTO_SAVE_MS = 5000;

let chatMessages = [];
let handoverData = {
    title: '인수인계서 초안',
    handoverTarget: '',
    workArea: '',
    handoverPeriod: '',
    mainTasks: '',
    ongoingProjects: '',
    precautions: '',
    attachments: [],
    documentType: 'employee'
};
let currentHandoverId = null;
let questionState = { stepIndex: 0, questionIndex: 0 };
let lastModifiedSection = 'basic-info';
let autoSaveInterval = null;
let pendingSaveTimeout = null;
let isProcessingMessage = false;
let isSavingToBackend = false;
let queuedSaveReason = null;

function getRequestedHandoverId() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('handoverId');
    const parsed = Number(id);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function isNewHandoverMode() {
    const params = new URLSearchParams(window.location.search);
    return params.get('new') === 'true';
}

const questionFlow = [
    {
        step: 'basic',
        responses: [
            { text: '인수인계를 받을 대상자의 이름을 알려주세요.', field: 'handoverTarget', section: 'basic-info' },
            { text: '어떤 업무 영역을 인수인계하시나요? (예: 개발, 운영, 기획 등)', field: 'workArea', section: 'basic-info' },
            { text: '인수인계 기간은 언제부터 언제까지인가요?', field: 'handoverPeriod', section: 'basic-info' }
        ]
    },
    {
        step: 'detailed',
        responses: [
            { text: '주요 업무 내용을 자세히 설명해주세요.', field: 'mainTasks', section: 'main-tasks' },
            { text: '현재 진행 중인 프로젝트가 있다면 알려주세요.', field: 'ongoingProjects', section: 'ongoing-projects' },
            { text: '특별히 주의해야 할 사항이 있나요?', field: 'precautions', section: 'precautions' }
        ]
    },
    {
        step: 'attachments',
        responses: [
            { text: '관련 문서나 파일이 있다면 첨부해주세요.' },
            { text: '추가로 전달하고 싶은 정보가 있나요?' }
        ]
    }
];

const aiResponses = {
    basic: [
        '네, 기본 정보를 잘 정리해드리겠습니다.',
        '알겠습니다. 기본 정보를 기록했습니다.',
        '좋습니다. 이제 다음 단계로 넘어가겠습니다.'
    ],
    detailed: [
        '상세한 내용을 잘 정리했습니다.',
        '네, 상세 정보를 기록했습니다.',
        '좋습니다. 이제 마지막 단계입니다.'
    ],
    attachments: [
        '첨부 파일을 확인했습니다.',
        '네, 추가 정보를 기록했습니다.',
        '완벽합니다! 인수인계서가 거의 완성되었습니다.'
    ],
    general: [
        '네, 이해했습니다.',
        '좋은 정보네요. 기록하겠습니다.',
        '알겠습니다. 계속 진행하겠습니다.',
        '네, 잘 정리했습니다.',
        '좋습니다. 다음 질문을 드리겠습니다.'
    ]
};

document.addEventListener('DOMContentLoaded', async () => {
    await initializeHandoverPage();
    setupEventListeners();
    startAutoSave();
    setTimeout(() => askNextQuestion(), 800);
});

async function initializeHandoverPage() {
    console.log('인수인계서 작성 페이지 초기화 중...');
    setDocumentDate();
    
    // 새 인수인계서 작성 모드인 경우 이전 데이터 초기화
    if (isNewHandoverMode()) {
        clearAllData();
    } else {
        loadLocalDraft();
    }
    
    restoreChatMessages();
    updateAttachmentsList();
    updatePreview();
    updateRequiredItems();
    await ensureBackendDraft();
    updateSaveStatus('준비됨', '방금 전');
}

function setDocumentDate() {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    document.getElementById('documentDate').textContent = dateString;
}

function clearAllData() {
    // 모든 전역 변수 초기화
    chatMessages = [];
    handoverData = {
        title: '인수인계서 초안',
        handoverTarget: '',
        workArea: '',
        handoverPeriod: '',
        mainTasks: '',
        ongoingProjects: '',
        precautions: '',
        attachments: [],
        documentType: 'employee'
    };
    currentHandoverId = null;
    questionState = { stepIndex: 0, questionIndex: 0 };
    lastModifiedSection = 'basic-info';
    
    // 로컬 스토리지 초기화
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    
    console.log('새 인수인계서 작성을 위해 모든 데이터를 초기화했습니다.');
}

function loadLocalDraft() {
    try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!stored) return;

        const parsed = JSON.parse(stored);
        if (parsed.handoverData) {
            handoverData = { ...handoverData, ...parsed.handoverData };
        }
        if (Array.isArray(parsed.chatMessages)) {
            chatMessages = parsed.chatMessages;
        }
        if (parsed.questionState) {
            questionState = parsed.questionState;
        }
        if (parsed.handoverId) {
            currentHandoverId = parsed.handoverId;
        }
        if (parsed.lastModifiedSection) {
            lastModifiedSection = parsed.lastModifiedSection;
        }
        console.log('로컬 초안을 불러왔습니다.');
    } catch (error) {
        console.warn('로컬 초안 불러오기 실패:', error);
    }
}

async function ensureBackendDraft() {
    if (!HandoverService) {
        console.warn('HandoverAPI가 로드되지 않아 백엔드 저장 없이 진행합니다.');
        return;
    }

    try {
        const requestedId = getRequestedHandoverId();
        if (requestedId && requestedId !== currentHandoverId) {
            currentHandoverId = requestedId;
        }

        if (currentHandoverId) {
            await hydrateFromBackend(currentHandoverId);
            return;
        }

        const payload = buildHandoverPayload(true);
        const response = await HandoverService.create(payload);
        if (response?.success && response.data?.id) {
            currentHandoverId = response.data.id;
            persistLocalDraft();
            console.log('새 인수인계서 초안을 서버에 생성했습니다.', currentHandoverId);
        }
    } catch (error) {
        console.warn('백엔드 서버 연결 실패. 로컬 저장 모드로 진행합니다:', error.message);
        // 백엔드 연결 실패 시 로컬 저장 모드로 전환
        currentHandoverId = null;
        updateSaveStatus('로컬 저장 모드', '백엔드 연결 실패');
    }
}

async function hydrateFromBackend(handoverId) {
    try {
        const response = await HandoverService.getById(handoverId);
        if (!response?.success || !response.data) {
            console.warn('서버에서 초안을 찾을 수 없습니다. 새로 생성합니다.');
            currentHandoverId = null;
            await ensureBackendDraft();
            return;
        }

        const payload = response.data;
        if (payload.title) {
            handoverData.title = payload.title;
        }
        if (payload.status === 'completed') {
            questionState = { stepIndex: questionFlow.length, questionIndex: 0 };
        }

        if (payload.content?.content) {
            const content = payload.content.content;
            const sections = Array.isArray(content.sections) ? content.sections : [];
            hydrateFromSections(sections);
            handoverData.attachments = content.attachments || [];
            lastModifiedSection = content.metadata?.lastModifiedSection || lastModifiedSection;
            updateAttachmentsList();
        }

        updatePreview();
        updateRequiredItems();
        persistLocalDraft();
        console.log('서버 초안을 불러왔습니다.');
    } catch (error) {
        console.error('서버 초안 불러오기 실패:', error);
    }
}

function hydrateFromSections(sections) {
    const findSection = (id) => sections.find((section) => section.id === id);

    const basicInfo = findSection('basic-info');
    if (basicInfo?.content) {
        try {
            const parsed = JSON.parse(basicInfo.content);
            handoverData.handoverTarget = parsed.handoverTarget || '';
            handoverData.workArea = parsed.workArea || '';
            handoverData.handoverPeriod = parsed.handoverPeriod || '';
        } catch (error) {
            console.warn('기본 정보 섹션 파싱 실패:', error);
        }
    }

    handoverData.mainTasks = findSection('main-tasks')?.content || '';
    handoverData.ongoingProjects = findSection('ongoing-projects')?.content || '';
    handoverData.precautions = findSection('precautions')?.content || '';
}

function buildHandoverPayload(includeEmpty = false) {
    const basicInfo = {
        handoverTarget: handoverData.handoverTarget || '',
        workArea: handoverData.workArea || '',
        handoverPeriod: handoverData.handoverPeriod || ''
    };

    const sections = [
        {
            id: 'basic-info',
            title: '기본 정보',
            content: `인수인계 대상: ${basicInfo.handoverTarget}\n업무 영역: ${basicInfo.workArea}\n인수인계 기간: ${basicInfo.handoverPeriod}`,
            order: 0,
            type: 'text'
        },
        {
            id: 'main-tasks',
            title: '주요 업무',
            content: handoverData.mainTasks || (includeEmpty ? '' : '-'),
            order: 1,
            type: 'text'
        },
        {
            id: 'ongoing-projects',
            title: '진행 중인 프로젝트',
            content: handoverData.ongoingProjects || (includeEmpty ? '' : '-'),
            order: 2,
            type: 'text'
        },
        {
            id: 'precautions',
            title: '주의 사항',
            content: handoverData.precautions || (includeEmpty ? '' : '-'),
            order: 3,
            type: 'text'
        }
    ];

    const attachments = (handoverData.attachments || []).map((file, index) => ({
        id: file.id || `local-${index}`,
        filename: file.name,
        filepath: file.filepath || '',
        fileSize: file.size || 0,
        mimeType: file.type || 'application/octet-stream',
        uploadedAt: file.uploadedAt || new Date().toISOString()
    }));

    const wordCount = sections.reduce((sum, section) => {
        if (!section.content) return sum;
        return sum + section.content.split(/\s+/).filter(Boolean).length;
    }, 0);

    return {
        title: buildDocumentTitle(),
        status: determineStatus(),
        priority: 'medium',
        category: handoverData.documentType,
        tags: [],
        content: {
            sections,
            attachments,
            metadata: {
                totalSections: sections.length,
                wordCount,
                lastModifiedSection
            }
        }
    };
}

function buildDocumentTitle() {
    if (handoverData.title && handoverData.title !== '인수인계서 초안') {
        return handoverData.title;
    }
    if (handoverData.handoverTarget) {
        return `${handoverData.handoverTarget} 인수인계서`;
    }
    return '인수인계서 초안';
}

function determineStatus() {
    const essentialsFilled = handoverData.handoverTarget && handoverData.workArea && handoverData.mainTasks;
    if (!essentialsFilled) return 'draft';
    if (handoverData.precautions && handoverData.ongoingProjects) return 'in_progress';
    return 'draft';
}

function setupEventListeners() {
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');
    chatInput.addEventListener('keydown', handleChatInputKeydown);
    sendButton.addEventListener('click', handleSendMessage);

    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarClose = document.getElementById('sidebarClose');
    const completeButton = document.getElementById('completeButton');
    sidebarToggle.addEventListener('click', toggleSidebar);
    sidebarClose.addEventListener('click', closeSidebar);
    if (completeButton) {
        completeButton.addEventListener('click', handleCompleteFromEditor);
    }

    // 뒤로가기 버튼 이벤트 리스너 추가
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.addEventListener('click', goBack);
    }

    setupSidebarFormListeners();
    setupFileUpload();
    setupPreviewActions();
    setupDocumentTypeToggle();

    window.addEventListener('beforeunload', () => {
        persistLocalDraft();
    });

    document.addEventListener('keydown', handleGlobalShortcuts);
}

function handleChatInputKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        handleSendMessage();
    }
}

function handleSendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();

    if (!message || isProcessingMessage) return;

    isProcessingMessage = true;
    chatInput.disabled = true;

    addUserMessage(message);
    chatInput.value = '';
    chatInput.style.height = 'auto';

    setTimeout(async () => {
        await processUserMessage(message);
        chatInput.disabled = false;
        chatInput.focus();
        isProcessingMessage = false;
    }, 600);
}

async function processUserMessage(message) {
    const currentQuestion = getCurrentQuestion();
    if (currentQuestion?.field) {
        handoverData[currentQuestion.field] = message;
        lastModifiedSection = currentQuestion.section || lastModifiedSection;
        updatePreview();
        updateRequiredItems();
    }

    const aiResponse = generateAIResponse(currentQuestion?.step);
    addAIMessage(aiResponse);

    advanceQuestionPointer();
    scheduleSave('chat');

    if (!isQuestionFlowComplete()) {
        setTimeout(() => askNextQuestion(), 1200);
    } else {
        setTimeout(() => {
            addAIMessage('필요한 정보가 모두 수집되었습니다. 언제든지 추가 정보를 알려주세요!');
        }, 1200);
    }
}

function addUserMessage(message) {
    chatMessages.push({ role: 'user', content: message, timestamp: Date.now() });
    renderChatMessage('user', message);
}

function addAIMessage(message) {
    chatMessages.push({ role: 'ai', content: message, timestamp: Date.now() });
    renderChatMessage('ai', message);
}

function renderChatMessage(role, message) {
    const chatContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;

    messageDiv.innerHTML = `
        <div class="message-avatar">
            <span class="${role === 'ai' ? 'ai-icon' : 'user-icon'}">${role === 'ai' ? '🤖' : '👤'}</span>
        </div>
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;

    chatContainer.appendChild(messageDiv);
    scrollToBottom();
}

function restoreChatMessages() {
    const chatContainer = document.getElementById('chatMessages');
    chatContainer.innerHTML = '';

    // 초기 환영 메시지
    renderChatMessage('ai', '안녕하세요! 인수인계서 작성을 도와드리겠습니다. 먼저 기본 정보부터 알려주세요.');

    // 새 작성 모드가 아닌 경우에만 이전 대화 기록 복원
    if (!isNewHandoverMode()) {
        chatMessages.forEach((msg) => {
            renderChatMessage(msg.role, msg.content);
        });
    }
}

function scrollToBottom() {
    const chatContainer = document.getElementById('chatMessages');
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function getCurrentQuestion() {
    const step = questionFlow[questionState.stepIndex];
    if (!step) return null;
    return { ...step.responses[questionState.questionIndex], step: step.step };
}

function advanceQuestionPointer() {
    const step = questionFlow[questionState.stepIndex];
    if (!step) return;

    if (questionState.questionIndex < step.responses.length - 1) {
        questionState.questionIndex += 1;
    } else {
        questionState.stepIndex += 1;
        questionState.questionIndex = 0;
    }

    persistLocalDraft();
}

function isQuestionFlowComplete() {
    return questionState.stepIndex >= questionFlow.length;
}

function askNextQuestion() {
    if (isQuestionFlowComplete()) return;
    const question = getCurrentQuestion();
    const message = question?.text || '추가로 공유하고 싶은 내용이 있나요?';
    addAIMessage(message);
}

function generateAIResponse(stepKey) {
    const responses = aiResponses[stepKey] || aiResponses.general;
    const randomIndex = Math.floor(Math.random() * responses.length);
    return responses[randomIndex];
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
}

function setupSidebarFormListeners() {
    const mapping = {
        sidebarHandoverTarget: 'handoverTarget',
        sidebarWorkArea: 'workArea',
        sidebarHandoverPeriod: 'handoverPeriod',
        sidebarMainTasks: 'mainTasks',
        sidebarOngoingProjects: 'ongoingProjects',
        sidebarPrecautions: 'precautions'
    };

    Object.entries(mapping).forEach(([inputId, field]) => {
        const input = document.getElementById(inputId);
        if (!input) return;

        input.value = handoverData[field] || '';
        input.addEventListener('input', (event) => {
            handoverData[field] = event.target.value;
            lastModifiedSection = resolveSectionByField(field);
            updatePreview();
            updateRequiredItems();
            scheduleSave('sidebar');
        });
    });
}

function resolveSectionByField(field) {
    switch (field) {
        case 'handoverTarget':
        case 'workArea':
        case 'handoverPeriod':
            return 'basic-info';
        case 'mainTasks':
            return 'main-tasks';
        case 'ongoingProjects':
            return 'ongoing-projects';
        case 'precautions':
            return 'precautions';
        default:
            return lastModifiedSection;
    }
}

function setupFileUpload() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');

    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        uploadZone.classList.add('dragover');
    });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
    uploadZone.addEventListener('drop', (event) => {
        event.preventDefault();
        uploadZone.classList.remove('dragover');
        handleFiles(event.dataTransfer.files);
    });

    fileInput.addEventListener('change', (event) => {
        handleFiles(event.target.files);
        fileInput.value = '';
    });
}

function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    files.forEach((file) => {
        handoverData.attachments.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString()
        });
    });

    updateAttachmentsList();
    scheduleSave('attachments');
}

function updateAttachmentsList() {
    const list = document.getElementById('uploadedFiles');
    list.innerHTML = '';

    handoverData.attachments.forEach((file, index) => {
        const fileRow = document.createElement('div');
        fileRow.className = 'uploaded-file';
        fileRow.innerHTML = `
            <span class="file-icon">📄</span>
            <span class="file-name">${file.name}</span>
            <span class="file-remove" data-index="${index}">×</span>
        `;
        fileRow.querySelector('.file-remove').addEventListener('click', () => removeFile(index));
        list.appendChild(fileRow);
    });
}

function removeFile(index) {
    handoverData.attachments.splice(index, 1);
    updateAttachmentsList();
    scheduleSave('attachments');
}

function setupPreviewActions() {
    const exportButton = document.querySelector('.export-button');
    const printButton = document.querySelector('.print-button');

    if (exportButton) {
        exportButton.addEventListener('click', handleExport);
    }
    if (printButton) {
        printButton.addEventListener('click', handlePrint);
    }
}

function handleExport() {
    const data = {
        ...handoverData,
        generatedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${buildDocumentTitle()}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function handlePrint() {
    const printContent = document.getElementById('previewContent').innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>${buildDocumentTitle()}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .handover-document { max-width: 800px; margin: 0 auto; }
                    .document-header { text-align: center; margin-bottom: 30px; }
                    .document-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
                    .document-meta { display: flex; justify-content: center; gap: 30px; margin-bottom: 20px; }
                    .document-section { margin-bottom: 30px; }
                    .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #ccc; padding-bottom: 5px; }
                    .info-item { margin-bottom: 10px; }
                    .info-label { font-weight: bold; }
                    .content-item { margin-bottom: 20px; }
                    .content-subtitle { font-weight: bold; margin-bottom: 10px; }
                </style>
            </head>
            <body>
                ${printContent}
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

function startAutoSave() {
    if (autoSaveInterval) clearInterval(autoSaveInterval);
    autoSaveInterval = setInterval(() => saveDraft('interval'), AUTO_SAVE_MS);
}

function scheduleSave(reason = 'auto') {
    if (pendingSaveTimeout) clearTimeout(pendingSaveTimeout);
    pendingSaveTimeout = setTimeout(() => saveDraft(reason), SAVE_DEBOUNCE_MS);
}

async function saveDraft(reason = 'auto') {
    console.log(`[저장 시작] 이유: ${reason}, ID: ${currentHandoverId}`);
    persistLocalDraft();

    if (!HandoverService || !currentHandoverId) {
        console.log('[저장 실패] HandoverService 또는 currentHandoverId가 없음');
        updateSaveStatus('로컬 저장됨', '오프라인');
        return;
    }

    if (isSavingToBackend) {
        console.log('[저장 대기] 이미 저장 중이므로 대기열에 추가');
        queuedSaveReason = reason;
        return;
    }

    try {
        isSavingToBackend = true;
        updateSaveStatus('저장 중...', '진행 중');
        const payload = buildHandoverPayload();
        console.log('[저장 요청] 페이로드:', payload);
        console.log('[저장 요청] API 호출 시작:', `PUT /api/handovers/${currentHandoverId}`);
        
        const response = await HandoverService.update(currentHandoverId, payload);
        console.log('[저장 성공] 응답:', response);
        updateSaveStatus('저장됨', formatRelativeTime(new Date()));
    } catch (error) {
        const message = DidimdolAPI.ErrorHandler ? DidimdolAPI.ErrorHandler.getErrorMessage(error) : error.message;
        console.error('[저장 실패] 에러:', error);
        console.error('[저장 실패] 메시지:', message);
        updateSaveStatus('저장 실패', message);
    } finally {
        isSavingToBackend = false;
        if (queuedSaveReason) {
            const nextReason = queuedSaveReason;
            queuedSaveReason = null;
            saveDraft(nextReason);
        }
    }
}

function persistLocalDraft() {
    try {
        const payload = {
            handoverId: currentHandoverId,
            handoverData,
            chatMessages,
            questionState,
            lastModifiedSection,
            lastSaved: new Date().toISOString()
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    } catch (error) {
        console.warn('로컬 저장 실패:', error);
    }
}

function formatRelativeTime(date) {
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return '방금 전';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    return `${Math.floor(diff / 3600000)}시간 전`;
}

function updateSaveStatus(text, subText) {
    const saveStatus = document.getElementById('saveStatus');
    if (!saveStatus) return;
    saveStatus.querySelector('.save-text').textContent = text;
    saveStatus.querySelector('.save-time').textContent = subText;
}

function updatePreview() {
    const handoverTargetEl = document.getElementById('handoverTarget');
    const workAreaEl = document.getElementById('workArea');
    const handoverPeriodEl = document.getElementById('handoverPeriod');
    const mainTasksEl = document.getElementById('mainTasks');
    const ongoingProjectsEl = document.getElementById('ongoingProjects');
    const precautionsEl = document.getElementById('precautions');
    
    if (handoverTargetEl) handoverTargetEl.textContent = handoverData.handoverTarget || '-';
    if (workAreaEl) workAreaEl.textContent = handoverData.workArea || '-';
    if (handoverPeriodEl) handoverPeriodEl.textContent = handoverData.handoverPeriod || '-';
    if (mainTasksEl) mainTasksEl.textContent = handoverData.mainTasks || '-';
    if (ongoingProjectsEl) ongoingProjectsEl.textContent = handoverData.ongoingProjects || '-';
    if (precautionsEl) precautionsEl.textContent = handoverData.precautions || '-';
}

function updateRequiredItems() {
    const requiredItems = document.querySelectorAll('.required-item');
    const requiredFields = ['handoverTarget', 'workArea', 'mainTasks'];

    requiredFields.forEach((field, index) => {
        const item = requiredItems[index];
        const icon = item?.querySelector('.required-icon');
        if (!item || !icon) return;

        if (handoverData[field] && handoverData[field].trim() !== '') {
            item.classList.add('completed');
            icon.textContent = '✅';
        } else {
            item.classList.remove('completed');
            icon.textContent = '❌';
        }
    });
}

function handleGlobalShortcuts(event) {
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        saveDraft('shortcut');
    }
    if (event.key === 'Escape') {
        closeSidebar();
    }
}

function setupDocumentTypeToggle() {
    const radios = document.querySelectorAll('input[name="documentType"]');
    radios.forEach((radio) => {
        radio.checked = radio.value === handoverData.documentType;
        radio.addEventListener('change', (event) => {
            handoverData.documentType = event.target.value;
            document.getElementById('employeeContent').style.display = handoverData.documentType === 'employee' ? 'block' : 'none';
            document.getElementById('projectContent').style.display = handoverData.documentType === 'project' ? 'block' : 'none';
            scheduleSave('document-type');
        });
    });

    document.getElementById('employeeContent').style.display = handoverData.documentType === 'employee' ? 'block' : 'none';
    document.getElementById('projectContent').style.display = handoverData.documentType !== 'employee' ? 'block' : 'none';
}

function goBack() {
    if (confirm('작성 중인 내용이 저장됩니다. 대시보드로 돌아가시겠습니까?')) {
        saveDraft('navigate');
        window.location.href = '../dashboard/index.html';
    }
}

// goBack 함수는 이벤트 리스너로 처리하므로 전역 할당 불필요

async function handleCompleteFromEditor() {
    if (!currentHandoverId) {
        alert('완료 처리할 인수인계서가 없습니다.');
        return;
    }
    if (!confirm('이 인수인계서를 완료 처리하시겠습니까? 완료 후에도 언제든지 다시 수정할 수 있습니다.')) {
        return;
    }
    try {
        if (!HandoverService) {
            throw new Error('HandoverAPI가 초기화되지 않았습니다.');
        }
        const payload = buildHandoverPayload();
        payload.status = 'completed';
        await HandoverService.update(currentHandoverId, payload);
        updateSaveStatus('완료됨', '방금 전');
        alert('인수인계서가 완료 처리되었습니다.');
    } catch (error) {
        const message = DidimdolAPI.ErrorHandler ? DidimdolAPI.ErrorHandler.getErrorMessage(error) : error.message;
        alert(`완료 처리 실패: ${message}`);
    }
}
