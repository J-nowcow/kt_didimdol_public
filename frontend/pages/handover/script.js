// 인수인계서 작성 페이지 JavaScript

// 전역 변수
let chatMessages = [];
let handoverData = {
    handoverTarget: '',
    workArea: '',
    handoverPeriod: '',
    mainTasks: '',
    ongoingProjects: '',
    precautions: '',
    attachments: []
};
let autoSaveInterval;
let currentQuestionStep = 0;

// AI 질문 플로우 (기본 정보 → 상세 내용 → 첨부 파일)
const questionFlow = [
    {
        step: 'basic',
        questions: [
            "인수인계를 받을 대상자의 이름을 알려주세요.",
            "어떤 업무 영역을 인수인계하시나요? (예: 개발, 운영, 기획 등)",
            "인수인계 기간은 언제부터 언제까지인가요?"
        ]
    },
    {
        step: 'detailed',
        questions: [
            "주요 업무 내용을 자세히 설명해주세요.",
            "현재 진행 중인 프로젝트가 있다면 알려주세요.",
            "특별히 주의해야 할 사항이 있나요?"
        ]
    },
    {
        step: 'attachments',
        questions: [
            "관련 문서나 파일이 있다면 첨부해주세요.",
            "추가로 전달하고 싶은 정보가 있나요?"
        ]
    }
];

// AI 응답 템플릿 (랜덤 출력용)
const aiResponses = {
    basic: [
        "네, 기본 정보를 잘 정리해드리겠습니다.",
        "알겠습니다. 기본 정보를 기록했습니다.",
        "좋습니다. 이제 다음 단계로 넘어가겠습니다."
    ],
    detailed: [
        "상세한 내용을 잘 정리했습니다.",
        "네, 상세 정보를 기록했습니다.",
        "좋습니다. 이제 마지막 단계입니다."
    ],
    attachments: [
        "첨부 파일을 확인했습니다.",
        "네, 추가 정보를 기록했습니다.",
        "완벽합니다! 인수인계서가 거의 완성되었습니다."
    ],
    general: [
        "네, 이해했습니다.",
        "좋은 정보네요. 기록하겠습니다.",
        "알겠습니다. 계속 진행하겠습니다.",
        "네, 잘 정리했습니다.",
        "좋습니다. 다음 질문을 드리겠습니다."
    ]
};

document.addEventListener('DOMContentLoaded', function() {
    // 페이지 초기화
    initializeHandoverPage();
    
    // 이벤트 리스너 설정
    setupEventListeners();
    
    // 자동저장 시작
    startAutoSave();
    
    // 첫 번째 AI 질문 시작
    setTimeout(() => {
        askNextQuestion();
    }, 1000);
});

// 페이지 초기화
function initializeHandoverPage() {
    console.log('인수인계서 작성 페이지 초기화 중...');
    
    // 현재 날짜 설정
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    document.getElementById('documentDate').textContent = dateString;
    
    // 로컬 스토리지에서 기존 데이터 불러오기
    loadSavedData();
    
    // 필수 항목 체크 업데이트
    updateRequiredItems();
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 채팅 입력
    const chatInput = document.getElementById('chatInput');
    const sendButton = document.getElementById('sendButton');
    
    chatInput.addEventListener('keydown', handleChatInputKeydown);
    sendButton.addEventListener('click', handleSendMessage);
    
    // 사이드바 토글
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarClose = document.getElementById('sidebarClose');
    
    sidebarToggle.addEventListener('click', toggleSidebar);
    sidebarClose.addEventListener('click', closeSidebar);
    
    // 사이드바 폼 입력
    setupSidebarFormListeners();
    
    // 파일 업로드
    setupFileUpload();
    
    // 미리보기 액션 버튼
    setupPreviewActions();
    
    // 인수인계서 유형 전환
    setupDocumentTypeToggle();
}

// 채팅 입력 키보드 이벤트
function handleChatInputKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleSendMessage();
    }
}

// 메시지 전송 처리
function handleSendMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    
    if (!message) return;
    
    // 사용자 메시지 추가
    addUserMessage(message);
    
    // 입력창 초기화
    chatInput.value = '';
    chatInput.style.height = 'auto';
    
    // AI 응답 시뮬레이션
    setTimeout(() => {
        processUserMessage(message);
    }, 1000);
}

// 사용자 메시지 추가
function addUserMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <span class="user-icon">👤</span>
        </div>
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// AI 메시지 추가
function addAIMessage(message) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message';
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <span class="ai-icon">🤖</span>
        </div>
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// 사용자 메시지 처리
function processUserMessage(message) {
    const currentStep = questionFlow[currentQuestionStep];
    
    // 메시지에서 정보 추출 및 저장
    extractAndSaveInfo(message, currentStep);
    
    // AI 응답 생성
    const aiResponse = generateAIResponse(currentStep);
    addAIMessage(aiResponse);
    
    // 다음 질문으로 진행
    currentQuestionStep++;
    if (currentQuestionStep < questionFlow.length) {
        setTimeout(() => {
            askNextQuestion();
        }, 1500);
    } else {
        // 모든 질문 완료
        setTimeout(() => {
            addAIMessage("인수인계서 작성이 완료되었습니다! 사이드바에서 상세 정보를 확인하고 수정할 수 있습니다.");
        }, 1500);
    }
}

// 정보 추출 및 저장
function extractAndSaveInfo(message, currentStep) {
    const lowerMessage = message.toLowerCase();
    
    if (currentStep.step === 'basic') {
        if (currentStep.questions[0].includes('이름')) {
            handoverData.handoverTarget = message;
        } else if (currentStep.questions[1].includes('업무 영역')) {
            handoverData.workArea = message;
        } else if (currentStep.questions[2].includes('기간')) {
            handoverData.handoverPeriod = message;
        }
    } else if (currentStep.step === 'detailed') {
        if (currentStep.questions[0].includes('주요 업무')) {
            handoverData.mainTasks = message;
        } else if (currentStep.questions[1].includes('진행 중인 프로젝트')) {
            handoverData.ongoingProjects = message;
        } else if (currentStep.questions[2].includes('주의')) {
            handoverData.precautions = message;
        }
    }
    
    // 미리보기 업데이트
    updatePreview();
    
    // 필수 항목 체크 업데이트
    updateRequiredItems();
}

// AI 응답 생성
function generateAIResponse(currentStep) {
    const responses = aiResponses[currentStep.step] || aiResponses.general;
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    return randomResponse;
}

// 다음 질문하기
function askNextQuestion() {
    const currentStep = questionFlow[currentQuestionStep];
    const questionIndex = currentQuestionStep % currentStep.questions.length;
    const question = currentStep.questions[questionIndex];
    
    addAIMessage(question);
}

// 미리보기 업데이트
function updatePreview() {
    // 기본 정보 업데이트
    document.getElementById('handoverTarget').textContent = handoverData.handoverTarget || '-';
    document.getElementById('workArea').textContent = handoverData.workArea || '-';
    document.getElementById('handoverPeriod').textContent = handoverData.handoverPeriod || '-';
    
    // 상세 내용 업데이트
    document.getElementById('mainTasks').textContent = handoverData.mainTasks || '-';
    document.getElementById('ongoingProjects').textContent = handoverData.ongoingProjects || '-';
    document.getElementById('precautions').textContent = handoverData.precautions || '-';
}

// 사이드바 토글
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
}

// 사이드바 닫기
function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('open');
}

// 사이드바 폼 리스너 설정
function setupSidebarFormListeners() {
    const formInputs = [
        'sidebarHandoverTarget',
        'sidebarWorkArea', 
        'sidebarHandoverPeriod',
        'sidebarMainTasks',
        'sidebarOngoingProjects',
        'sidebarPrecautions'
    ];
    
    formInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', handleSidebarInput);
        }
    });
}

// 사이드바 입력 처리
function handleSidebarInput(event) {
    const inputId = event.target.id;
    const value = event.target.value;
    
    // 데이터 매핑
    const fieldMapping = {
        'sidebarHandoverTarget': 'handoverTarget',
        'sidebarWorkArea': 'workArea',
        'sidebarHandoverPeriod': 'handoverPeriod',
        'sidebarMainTasks': 'mainTasks',
        'sidebarOngoingProjects': 'ongoingProjects',
        'sidebarPrecautions': 'precautions'
    };
    
    const fieldName = fieldMapping[inputId];
    if (fieldName) {
        handoverData[fieldName] = value;
        updatePreview();
        updateRequiredItems();
    }
}

// 파일 업로드 설정
function setupFileUpload() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    
    uploadZone.addEventListener('click', () => fileInput.click());
    uploadZone.addEventListener('dragover', handleDragOver);
    uploadZone.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
}

// 드래그 오버 처리
function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('dragover');
}

// 드롭 처리
function handleDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    
    const files = event.dataTransfer.files;
    handleFiles(files);
}

// 파일 선택 처리
function handleFileSelect(event) {
    const files = event.target.files;
    handleFiles(files);
}

// 파일 처리
function handleFiles(files) {
    Array.from(files).forEach(file => {
        handoverData.attachments.push({
            name: file.name,
            size: file.size,
            type: file.type
        });
    });
    
    updateAttachmentsList();
}

// 첨부 파일 목록 업데이트
function updateAttachmentsList() {
    const attachmentsList = document.getElementById('uploadedFiles');
    attachmentsList.innerHTML = '';
    
    handoverData.attachments.forEach((file, index) => {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'uploaded-file';
        fileDiv.innerHTML = `
            <span class="file-icon">📄</span>
            <span class="file-name">${file.name}</span>
            <span class="file-remove" onclick="removeFile(${index})">×</span>
        `;
        attachmentsList.appendChild(fileDiv);
    });
}

// 파일 제거
function removeFile(index) {
    handoverData.attachments.splice(index, 1);
    updateAttachmentsList();
}

// 미리보기 액션 설정
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

// 내보내기 처리
function handleExport() {
    const data = {
        ...handoverData,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `인수인계서_${handoverData.handoverTarget || '미정'}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

// 인쇄 처리
function handlePrint() {
    const printContent = document.getElementById('previewContent').innerHTML;
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <html>
            <head>
                <title>인수인계서</title>
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

// 자동저장 시작
function startAutoSave() {
    autoSaveInterval = setInterval(() => {
        saveToLocalStorage();
        updateSaveStatus();
    }, 30000); // 30초마다 저장
}

// 로컬 스토리지에 저장
function saveToLocalStorage() {
    const saveData = {
        handoverData,
        chatMessages,
        currentQuestionStep,
        lastSaved: new Date().toISOString()
    };
    
    localStorage.setItem('handoverData', JSON.stringify(saveData));
    console.log('자동저장 완료:', new Date().toLocaleTimeString());
}

// 저장된 데이터 불러오기
function loadSavedData() {
    const savedData = localStorage.getItem('handoverData');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            handoverData = data.handoverData || handoverData;
            chatMessages = data.chatMessages || [];
            currentQuestionStep = data.currentQuestionStep || 0;
            
            // 미리보기 업데이트
            updatePreview();
            
            // 채팅 메시지 복원
            restoreChatMessages();
            
            console.log('저장된 데이터 불러오기 완료');
        } catch (error) {
            console.error('저장된 데이터 불러오기 실패:', error);
        }
    }
}

// 채팅 메시지 복원
function restoreChatMessages() {
    // 실제 구현에서는 저장된 메시지들을 복원
    // 현재는 기본 환영 메시지만 유지
}

// 저장 상태 업데이트
function updateSaveStatus() {
    const saveTime = document.getElementById('saveTime');
    const now = new Date();
    saveTime.textContent = '방금 전';
    
    // 1분 후에 "1분 전"으로 업데이트
    setTimeout(() => {
        saveTime.textContent = '1분 전';
    }, 60000);
}

// 필수 항목 체크 업데이트
function updateRequiredItems() {
    const requiredItems = document.querySelectorAll('.required-item');
    const requiredFields = ['handoverTarget', 'workArea', 'mainTasks'];
    
    requiredFields.forEach((field, index) => {
        const item = requiredItems[index];
        const icon = item.querySelector('.required-icon');
        const text = item.querySelector('.required-text');
        
        if (handoverData[field] && handoverData[field].trim() !== '') {
            item.classList.add('completed');
            icon.textContent = '✅';
        } else {
            item.classList.remove('completed');
            icon.textContent = '❌';
        }
    });
}

// 채팅 스크롤을 맨 아래로
function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// 뒤로가기 함수
function goBack() {
    if (confirm('작성 중인 내용이 저장됩니다. 대시보드로 돌아가시겠습니까?')) {
        saveToLocalStorage();
        window.location.href = '../dashboard/index.html';
    }
}

// 페이지 언로드 시 자동저장
window.addEventListener('beforeunload', function(event) {
    saveToLocalStorage();
});

// 로딩 오버레이 표시/숨김
function showLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// AI 응답 시뮬레이션 (로딩 효과 포함)
function simulateAIResponse(message, delay = 1000) {
    showLoadingOverlay();
    
    setTimeout(() => {
        hideLoadingOverlay();
        addAIMessage(message);
    }, delay);
}

// 키보드 단축키
document.addEventListener('keydown', function(event) {
    // Ctrl + S: 수동 저장
    if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        saveToLocalStorage();
        updateSaveStatus();
        
        // 저장 완료 알림
        const saveStatus = document.getElementById('saveStatus');
        saveStatus.style.background = '#dcfce7';
        saveStatus.style.borderColor = '#bbf7d0';
        saveStatus.querySelector('.save-text').textContent = '저장됨';
        
        setTimeout(() => {
            saveStatus.style.background = '#f0fdf4';
            saveStatus.style.borderColor = '#bbf7d0';
        }, 2000);
    }
    
    // Escape: 사이드바 닫기
    if (event.key === 'Escape') {
        closeSidebar();
    }
});

// 인수인계서 유형 전환 설정
function setupDocumentTypeToggle() {
    const typeRadios = document.querySelectorAll('input[name="documentType"]');
    
    typeRadios.forEach(radio => {
        radio.addEventListener('change', handleDocumentTypeChange);
    });
}

// 인수인계서 유형 변경 처리
function handleDocumentTypeChange(event) {
    const selectedType = event.target.value;
    const employeeContent = document.getElementById('employeeContent');
    const projectContent = document.getElementById('projectContent');
    
    if (selectedType === 'employee') {
        employeeContent.style.display = 'block';
        projectContent.style.display = 'none';
    } else if (selectedType === 'project') {
        employeeContent.style.display = 'none';
        projectContent.style.display = 'block';
    }
    
    console.log('인수인계서 유형 변경:', selectedType);
}

// 반응형 디자인 처리
function handleResize() {
    const width = window.innerWidth;
    
    if (width <= 1200) {
        document.body.classList.add('mobile-layout');
    } else {
        document.body.classList.remove('mobile-layout');
    }
}

window.addEventListener('resize', handleResize);
handleResize(); // 초기 실행
