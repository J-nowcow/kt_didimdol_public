# PR Template

## Description
PR 양식 템플릿을 생성합니다.

## Command
```bash
cat .cursor/pr-template.md
```

## Usage
1. 커서에서 `Cmd+Shift+P` (또는 `Ctrl+Shift+P`)
2. "Cursor: Run Command" 입력
3. "PR Template" 선택
4. 터미널에서 템플릿 내용 확인

## Template Content
```markdown
# PR Check List
- [ ] * Self Code Review fininshed
- [ ] * Formatting fininshed
- [ ] * Lint/Unit/Module Test fiinished

## What does this PR do
(예시)동시 로그인 토스트 위치 변경 PR 입니다.

## 테스트방법
(예시)
unit test: npm run test:unit
module test: npm run test:module
~~ 테스트 시 ~~ 를 설정 후 ~~ 합니다.

## 테스트화면
(예시)화면결과를 첨부합니다.

## Related Issues
(예시)https://kt-bybc.atlassian.net/browse/KAN-105
```
